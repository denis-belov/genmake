#!/usr/bin/env node


/*
eslint-disable

max-len,
max-params,
max-statements,
no-lone-blocks,
*/



const path = require('path');
const fs = require('fs');
const child_process = require('child_process');



const LOG = console.log.bind(console);

const replaceVar = (src_str, _var, val) =>
{
	let result = src_str;

	if (result.includes(_var))
	{
		result = replaceVar(result.replace(_var, val), _var);
	}

	return result;
};

const collectFiles = (dir, variables, _files = null) =>
{
	const files = _files || [];

	const dir_items = fs.readdirSync(dir);

	dir_items.forEach
	(
		(_item) =>
		{
			let item_path = path.join(dir, _item);

			if (fs.lstatSync(item_path).isFile())
			{
				for (const key in variables)
				{
					item_path = replaceVar(item_path, variables[key], key);
				}

				files.push(item_path);

				return;
			}

			collectFiles(item_path, variables, files);
		},
	);

	return files;
};

const makeArray = (_object) => (Array.isArray(_object) ? _object : [ _object || '' ].filter((elm) => elm));

// Reset = "\x1b[0m"
// Bright = "\x1b[1m"
// Dim = "\x1b[2m"
// Underscore = "\x1b[4m"
// Blink = "\x1b[5m"
// Reverse = "\x1b[7m"
// Hidden = "\x1b[8m"

// FgBlack = "\x1b[30m"
// FgRed = "\x1b[31m"
// FgGreen = "\x1b[32m"
// FgYellow = "\x1b[33m"
// FgBlue = "\x1b[34m"
// FgMagenta = "\x1b[35m"
// FgCyan = "\x1b[36m"
// FgWhite = "\x1b[37m"

// BgBlack = "\x1b[40m"
// BgRed = "\x1b[41m"
// BgGreen = "\x1b[42m"
// BgYellow = "\x1b[43m"
// BgBlue = "\x1b[44m"
// BgMagenta = "\x1b[45m"
// BgCyan = "\x1b[46m"
// BgWhite = "\x1b[47m"

// const colorize = (text) =>
// {
// 	let color = null;

// 	switch ((text.toLowerCase().match(/error|failed|warning|note/) || [])[0])
// 	{
// 	case 'error':
// 	{
// 		color = '\x1b[31m%s\x1b[0m';

// 		break;
// 	}

// 	// case 'failed':
// 	// {
// 	// 	color = 'red';

// 	// 	break;
// 	// }

// 	// case 'warning':
// 	// {
// 	// 	color = 'yellow';

// 	// 	break;
// 	// }

// 	// case 'note':
// 	// {
// 	// 	color = 'grey';

// 	// 	break;
// 	// }

// 	default:
// 	{
// 		color = '\x1b[34m%s\x1b[0m';
// 	}
// 	}

// 	LOG(color, text);
// };



const C_EXT = [ '.c' ];
// const CPP_EXT = [ '.cpp' ];



class Make
{
	// compile constants

	static GCC_X64 = 'gcc-x64';
	static MSVS_X64 = 'msvs-x64';
	static EMCC_X64 = 'emcc-x64';
	static LLVM_WASM_X64 = 'llvm-wasm-x64';



	constructor (options)
	{
		const
			{
				GCC_X64,
				MSVS_X64,
				EMCC_X64,
				LLVM_WASM_X64,
			} = Make;

		this.env = options?.env || GCC_X64;
		this.dirname = options?.dirname || '';

		this.output = '';



		// file extensions. RENAME!

		let a = null;

		switch (this.env)
		{
		case GCC_X64:
		case LLVM_WASM_X64:

			a = 'a';

			break;

		case EMCC_X64:

			a = 'a';

			break;

		case MSVS_X64:

			a = 'lib';

			break;

		default:
		}

		this.a = a;



		// object files

		let o = null;

		switch (this.env)
		{
		case GCC_X64:
		case EMCC_X64:
		case LLVM_WASM_X64:

			o = 'o';

			break;

		case MSVS_X64:

			o = 'obj';

			break;

		default:
		}



		// assembly files

		let s = null;

		switch (this.env)
		{
		case GCC_X64:

			s = 's';

			break;

		case MSVS_X64:

			s = 'asm';

			break;

		case EMCC_X64:

			break;

		case LLVM_WASM_X64:

			// wasm2wat
			// s = 'wat';

			// wasm-decompile
			s = 'dcmp';

			break;

		default:
		}

		this.s = s;



		let bin = null;

		switch (this.env)
		{
		case GCC_X64:

			bin = 'bin';

			break;

		case MSVS_X64:

			bin = 'exe';

			break;

		case EMCC_X64:

			bin = 'js';

			break;

		case LLVM_WASM_X64:

			bin = 'wasm';

			break;

		default:
		}



		// tools

		let ASSEMBLER = null;

		switch (this.env)
		{
		case GCC_X64:

			// GAS
			ASSEMBLER = 'gcc';

			break;

		case MSVS_X64:

			// MASM
			ASSEMBLER = 'ml64';

			break;

		default:
		}

		let ASSEMBLER_ARG = null;

		switch (this.env)
		{
		case GCC_X64:

			ASSEMBLER_ARG = '-c';

			break;

		case MSVS_X64:

			ASSEMBLER_ARG = '/c';

			break;

		default:
		}



		let C_COMPILER = null;

		switch (this.env)
		{
		case GCC_X64:

			C_COMPILER = 'gcc';

			break;

		case MSVS_X64:

			C_COMPILER = 'cl';

			break;

		case EMCC_X64:

			C_COMPILER = 'emcc';

			break;

		case LLVM_WASM_X64:

			C_COMPILER = 'clang';

			break;

		default:
		}

		let C_COMPILER_ARG = null;

		switch (this.env)
		{
		case GCC_X64:

			C_COMPILER_ARG = '-c -m64 -msse3 -Ofast -funroll-loops -Wall -Wextra -Wpedantic';

			break;

		case MSVS_X64:

			C_COMPILER_ARG = '/c /EHsc /MP999 /O2';

			break;

		case EMCC_X64:

			C_COMPILER_ARG = '-c -O3 -msimd128 -msse -Wall -Wextra -Wpedantic';

			break;

		case LLVM_WASM_X64:

			C_COMPILER_ARG = '-c --target=wasm64 --no-standard-libraries -Wall -Wextra -Wpedantic';

			break;

		default:
		}



		let CPP_COMPILER = null;

		switch (this.env)
		{
		case GCC_X64:

			CPP_COMPILER = 'g++';

			break;

		case MSVS_X64:

			CPP_COMPILER = 'cl';

			break;

		case EMCC_X64:

			CPP_COMPILER = 'emcc';

			break;

		case LLVM_WASM_X64:

			CPP_COMPILER = 'clang++';

			break;

		default:
		}

		let CPP_COMPILER_ARG = null;

		switch (this.env)
		{
		case GCC_X64:

			CPP_COMPILER_ARG = '-c -std=c++20 -m64 -msse3 -Ofast -funroll-loops -Wall -Wextra -Wpedantic -Wno-cpp';

			break;

		case MSVS_X64:

			CPP_COMPILER_ARG = '/c /std:c++20 /EHsc /MP999 /O2';

			break;

		case EMCC_X64:

			CPP_COMPILER_ARG = '-c -std=c++20 -O3 -msimd128 -msse -Wall -Wextra -Wpedantic';

			break;

		case LLVM_WASM_X64:

			CPP_COMPILER_ARG = '-c -std=c++20 --target=wasm32 -O3 -msimd128 --no-standard-libraries -Wall -Wextra -Wpedantic';

			break;

		default:
		}



		let BUILDER = null;

		switch (this.env)
		{
		case GCC_X64:

			BUILDER = 'ld';

			break;

		case MSVS_X64:

			BUILDER = 'lib';

			break;

		case EMCC_X64:

			BUILDER = 'emcc';

			break;

		case LLVM_WASM_X64:

			BUILDER = 'wasm-ld';

			break;

		default:
		}

		let BUILDER_ARG = null;

		switch (this.env)
		{
		case GCC_X64:

			BUILDER_ARG = '-r -flto';

			break;

		case MSVS_X64:

			BUILDER_ARG = '';

			break;

		case EMCC_X64:

			BUILDER_ARG = '';

			break;

		case LLVM_WASM_X64:

			BUILDER_ARG = '-mwasm32 --export-all --no-entry';

			break;

		default:
		}



		let LINKER = null;

		switch (this.env)
		{
		case GCC_X64:

			LINKER = 'g++';

			break;

		case MSVS_X64:

			LINKER = 'link';

			break;

		case EMCC_X64:

			LINKER = 'emcc';

			break;

		case LLVM_WASM_X64:

			LINKER = 'wasm-ld';

			break;

		default:
		}

		let LINKER_ARG = null;

		switch (this.env)
		{
		case GCC_X64:

			LINKER_ARG = '-flto';

			break;

		case MSVS_X64:

			LINKER_ARG =
			[
				'/SUBSYSTEM:CONSOLE',
				'/NODEFAULTLIB:LIBUCRT',
				'/NODEFAULTLIB:MSVCRT',
			].join(' ');

			break;

		case EMCC_X64:

			LINKER_ARG =
			[
				'--bind',
				'-s WASM=1',
				'-s SINGLE_FILE=1',
				'-s MODULARIZE=1',
				'-s EXPORT_ES6=1',
				'-s USE_ES6_IMPORT_META=0',
				'-s ENVIRONMENT=web',
				'-s EXPORTED_RUNTIME_METHODS=\'["ccall", "cwrap"]\'',
				'-s ASSERTIONS=1',
			].join(' ');

			break;

		case LLVM_WASM_X64:

			LINKER_ARG = '-mwasm32 --export-all --no-entry';

			break;

		default:
		}



		// DUMP_TOOL



		let MAKE_TOOL = null;

		switch (this.env)
		{
		case GCC_X64:

			MAKE_TOOL = 'make';

			break;

		case MSVS_X64:

			MAKE_TOOL = 'nmake';

			break;

		case EMCC_X64:
		{
			switch (process.platform)
			{
			case 'linux':

				MAKE_TOOL = 'emmake make';

				break;

			case 'win32':

				MAKE_TOOL = 'emmake nmake';

				break;

			default:
			}

			break;
		}

		case LLVM_WASM_X64:
		{
			switch (process.platform)
			{
			case 'linux':

				MAKE_TOOL = 'make';

				break;

			case 'win32':

				MAKE_TOOL = 'nmake';

				break;

			default:
			}

			break;
		}

		default:
		}



		let MAKE_TOOL_MAKEFILE_ARG = null;

		switch (this.env)
		{
		case GCC_X64:

			MAKE_TOOL_MAKEFILE_ARG = '-f';

			break;

		case MSVS_X64:

			MAKE_TOOL_MAKEFILE_ARG = '/F';

			break;

		case EMCC_X64: {

			switch (process.platform)
			{
			case 'linux':

				MAKE_TOOL_MAKEFILE_ARG = '-f';

				break;

			case 'win32':

				MAKE_TOOL_MAKEFILE_ARG = '/F';

				break;

			default:
			}

			break;
		}

		case LLVM_WASM_X64:
		{
			switch (process.platform)
			{
			case 'linux':

				MAKE_TOOL_MAKEFILE_ARG = '-f';

				break;

			case 'win32':

				MAKE_TOOL_MAKEFILE_ARG = '/F';

				break;

			default:
			}

			break;
		}

		default:
		}



		let MAKE_TOOL_ARG = null;

		switch (this.env)
		{
		case GCC_X64:

			MAKE_TOOL_ARG = '';

			break;

		case MSVS_X64:

			MAKE_TOOL_ARG = '';

			break;

		case EMCC_X64:

			MAKE_TOOL_ARG = '';

			break;

		case LLVM_WASM_X64:

			MAKE_TOOL_ARG = '';

			break;

		default:
		}



		// functions

		// mkdir is related to OS

		let mkdir = null;

		switch (process.platform)
		{
		case 'linux':

			mkdir = (dir) => `mkdir -p ${ dir }`;

			break;

		case 'win32':

			mkdir = (dir) => `(IF NOT EXIST ${ dir } mkdir ${ dir })`;

			break;

			// const folders = dir.split('/');

			// return folders.map((_, index) => {

			// 	const _dir = folders.slice(0, index + 1).join('/');

			// 	return `(IF NOT EXIST ${ _dir } mkdir ${ _dir })`;
			// }).join(' && ');

		default:
		}



		// make includes overriding possibility
		// make specific compiler arguments and arguments overriding possibility
		this.cpp = null;

		switch (this.env)
		{
		case GCC_X64:

			this.cpp = (file, headers, includes_global, includes_local, location, flags) =>
			{
				const { dir, base, ext, name } = path.parse(file);

				let out = '';

				out += `$(BUILD)/${ location }/${ o }/${ dir }/${ name }.${ o } : ${ dir }/${ base } ${ headers.join(' ') }\n`;

				out += `\t${ mkdir(`$(BUILD)/${ location }/${ o }/${ dir }`) } && ${ mkdir(`$(BUILD)/${ location }/${ s }/${ dir }`) } && `;

				out += `${ C_EXT.includes(ext) ? C_COMPILER : CPP_COMPILER } ${ dir }/${ base } ${ C_EXT.includes(ext) ? C_COMPILER_ARG : `${ CPP_COMPILER_ARG } $(CUSTOM_CPPFLAGS)` } ${ flags || '' } ${ includes_global.map((include) => `-I ${ include }`).join(' ') } ${ includes_local.map((include) => `-I ${ include }`).join(' ') } -o $(BUILD)/${ location }/${ o }/${ dir }/${ name }.${ o }`;

				out += ` && objdump -d -M intel -S $(BUILD)/${ location }/${ o }/${ dir }/${ name }.${ o } > $(BUILD)/${ location }/${ s }/${ dir }/${ name }.${ s }`;

				this.output += `${ out }\n\n`;
			};

			break;

		case MSVS_X64:

			this.cpp = (file, headers, includes_global, includes_local, location) =>
			{
				const { dir, base, ext, name } = path.parse(file);

				let out = '';

				out += `$(BUILD)/${ location }/${ o }/${ dir }/${ name }.${ o } : ${ dir }/${ base } ${ headers.join(' ') }\n`;

				out += `\t${ mkdir(`$(BUILD)/${ location }/${ o }/${ dir }`) } && ${ mkdir(`$(BUILD)/${ location }/${ s }/${ dir }`) } && `;

				out += `${ C_EXT.includes(ext) ? C_COMPILER : CPP_COMPILER } ${ dir }/${ base } ${ C_EXT.includes(ext) ? C_COMPILER_ARG : `${ CPP_COMPILER_ARG } $(CUSTOM_CPPFLAGS)` } ${ includes_global.map((include) => `/I${ include }`).join(' ') } ${ includes_local.map((include) => `/I${ include }`).join(' ') } /Fo$(BUILD)/${ location }/${ o }/${ dir }/${ name }.${ o }`;

				out += ` /FA /Fa$(BUILD)/${ location }/${ s }/${ dir }/${ name }.${ s }`;

				this.output += `${ out }\n\n`;
			};

			break;

		case EMCC_X64:

			this.cpp = (file, headers, includes_global, includes_local, location) =>
			{
				const { dir, base, ext, name } = path.parse(file);

				let out = '';

				out += `$(BUILD)/${ location }/${ o }/${ dir }/${ name }.${ o } : ${ dir }/${ base } ${ headers.join(' ') }\n`;

				out += `\t${ mkdir(`$(BUILD)/${ location }/${ o }/${ dir }`) } && ${ mkdir(`$(BUILD)/${ location }/${ s }/${ dir }`) } && `;

				out += `${ C_EXT.includes(ext) ? C_COMPILER : CPP_COMPILER } ${ dir }/${ base } ${ C_EXT.includes(ext) ? C_COMPILER_ARG : `${ CPP_COMPILER_ARG } $(CUSTOM_CPPFLAGS)` } ${ includes_global.map((include) => `-I ${ include }`).join(' ') } ${ includes_local.map((include) => `-I ${ include }`).join(' ') } -o $(BUILD)/${ location }/${ o }/${ dir }/${ name }.${ o }`;

				// emcc object file to (?) assembly

				this.output += `${ out }\n\n`;
			};

			break;

		case LLVM_WASM_X64:

			this.cpp = (file, headers, includes_global, includes_local, location) =>
			{
				const { dir, base, ext, name } = path.parse(file);

				let out = '';

				out += `$(BUILD)/${ location }/${ o }/${ dir }/${ name }.${ o } : ${ dir }/${ base } ${ headers.join(' ') }\n`;

				out += `\t${ mkdir(`$(BUILD)/${ location }/${ o }/${ dir }`) } && ${ mkdir(`$(BUILD)/${ location }/${ s }/${ dir }`) } && `;

				out += `${ C_EXT.includes(ext) ? C_COMPILER : CPP_COMPILER } ${ dir }/${ base } ${ C_EXT.includes(ext) ? C_COMPILER_ARG : `${ CPP_COMPILER_ARG } $(CUSTOM_CPPFLAGS)` } ${ includes_global.map((include) => `-I ${ include }`).join(' ') } ${ includes_local.map((include) => `-I ${ include }`).join(' ') } -o $(BUILD)/${ location }/${ o }/${ dir }/${ name }.${ o }`;

				// clang object file to llvm assembly

				this.output += `${ out }\n\n`;
			};

			break;

		default:
		}



		switch (this.env)
		{
		case GCC_X64:

			this.asm = (file, location = 'internal') =>
			{
				const { dir, name } = path.parse(file);

				let out = '';

				out += `$(BUILD)/${ location }/${ o }/${ dir }/${ name }.${ o } : $(SRC)/${ dir }/${ name }.${ s }\n`;

				out += `\t${ mkdir(`$(BUILD)/${ location }/${ o }/${ dir }`) } && `;

				out += `${ ASSEMBLER } $(SRC)/${ dir }/${ name }.${ s } ${ ASSEMBLER_ARG } -o $(BUILD)/${ location }/${ o }/${ dir }/${ name }.${ o }`;

				this.output += `${ out }\n\n`;
			};

			break;

		case MSVS_X64:

			this.asm = (file, location = 'internal') =>
			{
				const { dir, name } = path.parse(file);

				let out = '';

				out += `$(BUILD)/${ location }/${ o }/${ dir }/${ name }.${ o } : $(SRC)/${ dir }/${ name }.${ s }\n`;

				out += `\t${ mkdir(`$(BUILD)/${ location }/${ o }/${ dir }`) } && `;

				out += `${ ASSEMBLER } $(SRC)/${ dir }/${ name }.${ s } ${ ASSEMBLER_ARG } /Fo$(BUILD)/${ location }/${ o }/${ dir }/${ name }.${ o }`;
				// out += `${ ASSEMBLER } ${ dir }/${ name }.${ s } ${ ASSEMBLER_ARG } -o $(BUILD)/${ location }/${ o }/${ dir }/${ name }.${ o }`;

				this.output += `${ out }\n\n`;
			};

			break;

		default:
		}



		// this.static = (name, files = [], makefile) =>
		// {
		// 	let out = '';

		// 	out += `${ name }.${ a } : ${ files.join(' ') }\n`;

		// 	out += `\t${ MAKE_TOOL } ${ MAKE_TOOL_ARG } ${ MAKE_TOOL_MAKEFILE_ARG } ${ makefile }`;

		// 	this.output += `${ out }\n\n`;
		// };



		// switch (this.env)
		// {
		// case GCC_X64:

		// 	this.linkStatic = (target_name, _options) =>
		// 	{
		// 		const static_libraries = makeArray(_options?.static_libraries);
		// 		const source_files_internal = makeArray(_options?.source_files?.internal);
		// 		const source_files_external = makeArray(_options?.source_files?.external);

		// 		const linked_units =
		// 		[
		// 			`${ source_files_internal.map((file) => `$(BUILD)/internal/${ o }/${ file }.${ o }`).join(' ') }`,
		// 			`${ source_files_external.map((file) => `$(BUILD)/external/${ o }/${ file }.${ o }`).join(' ') }`,
		// 			`${
		// 				static_libraries
		// 					.map
		// 					(
		// 						(file) =>
		// 						{
		// 							if (file.watch)
		// 							{
		// 								for (const key in _options.variables)
		// 								{
		// 									LOG(444, replaceVar(file.watch, key, _options.variables[key]))
		// 								}

		// 								file.watch = replaceVar(file.watch, key, _options.variables[key]);
		// 							}

		// 							return `${ file.library || file }.${ a }`
		// 						},
		// 					)
		// 					.join(' ')
		// 			}`,
		// 		].join(' ');

		// 		let out = '';

		// 		out += `$(BUILD)/output/${ a }/${ target_name }.${ a } : ${ linked_units }\n`;

		// 		out += `\t${ mkdir(`$(BUILD)/output/${ a }`) } && ${ mkdir(`$(BUILD)/output/${ s }`) } && `;

		// 		out += `${ BUILDER } ${ linked_units } ${ BUILDER_ARG } -o $(BUILD)/output/${ a }/${ target_name }.${ a }`;

		// 		out += ` && objdump -d -M intel -S $(BUILD)/output/${ a }/${ target_name }.${ a } > $(BUILD)/output/${ s }/${ target_name }.${ s }`;

		// 		// this.output += `${ out }\n\n`;
		// 		this.output = `${ out }\n\n${ this.output }`;
		// 	};

		// 	break;

		// case MSVS_X64:

		// 	this.linkStatic = (target_name, _options) =>
		// 	{
		// 		const static_libraries = makeArray(_options?.static_libraries);
		// 		const source_files_internal = makeArray(_options?.source_files?.internal);
		// 		const source_files_external = makeArray(_options?.source_files?.external);

		// 		const linked_units =
		// 		[
		// 			`${ source_files_internal.map((file) => `$(BUILD)/internal/${ o }/${ file }.${ o }`).join(' ') }`,
		// 			`${ source_files_external.map((file) => `$(BUILD)/external/${ o }/${ file }.${ o }`).join(' ') }`,
		// 			`${
		// 				static_libraries
		// 					.map
		// 					(
		// 						(file) =>
		// 						{
		// 							return `${ file.library || file }.${ a }`
		// 						},
		// 					)
		// 					.join(' ')
		// 			}`,
		// 		].join(' ');

		// 		let out = '';

		// 		out += `$(BUILD)/output/${ a }/${ target_name }.${ a } : ${ linked_units }\n`;

		// 		out += `\t${ mkdir(`$(BUILD)/output/${ a }`) } && && ${ mkdir(`$(BUILD)/output/${ s }`) } && `;

		// 		out += `${ BUILDER } ${ linked_units } ${ BUILDER_ARG } /OUT:$(BUILD)/output/${ a }/${ target_name }.${ a }`;

		// 		out += ` && dumpbin /disasm $(BUILD)/output/${ a }/${ target_name }.${ a } /out:$(BUILD)/output/${ s }/${ target_name }.${ s }`;

		// 		// this.output += `${ out }\n\n`;
		// 		this.output = `${ out }\n\n${ this.output }`;
		// 	};

		// 	break;

		// case EMCC_X64:

		// 	this.linkStatic = (target_name, _options) =>
		// 	{
		// 		const static_libraries = makeArray(_options?.static_libraries);
		// 		const source_files_internal = makeArray(_options?.source_files?.internal);
		// 		const source_files_external = makeArray(_options?.source_files?.external);

		// 		const linked_units =
		// 		[
		// 			`${ source_files_internal.map((file) => `$(BUILD)/internal/${ o }/${ file }.${ o }`).join(' ') }`,
		// 			`${ source_files_external.map((file) => `$(BUILD)/external/${ o }/${ file }.${ o }`).join(' ') }`,
		// 			`${
		// 				static_libraries
		// 					.map
		// 					(
		// 						(file) =>
		// 						{
		// 							return `${ file.library || file }.${ a }`
		// 						},
		// 					)
		// 					.join(' ')
		// 			}`,
		// 		].join(' ');

		// 		let out = '';

		// 		out += `$(BUILD)/output/${ a }/${ target_name }.${ a } : ${ linked_units }\n`;

		// 		// out += `\t${ mkdir(`$(BUILD)/output/${ a }`) } && ${ mkdir(`$(BUILD)/output/${ s }`) } && `;
		// 		out += `\t${ mkdir(`$(BUILD)/output/${ a }`) } && `;

		// 		out += `${ BUILDER } ${ linked_units } ${ BUILDER_ARG } -o $(BUILD)/output/${ a }/${ target_name }.${ a }`;

		// 		// out += ` && objdump -d -M intel -S $(BUILD)/output/${ a }/${ target_name }.${ a } > $(BUILD)/output/${ s }/${ target_name }.${ s }`;

		// 		// this.output += `${ out }\n\n`;
		// 		this.output = `${ out }\n\n${ this.output }`;
		// 	};

		// 	break;

		// case LLVM_WASM_X64:

		// 	this.linkStatic = (target_name, _options) =>
		// 	{
		// 		const static_libraries = makeArray(_options?.static_libraries);
		// 		const source_files_internal = makeArray(_options?.source_files?.internal);
		// 		const source_files_external = makeArray(_options?.source_files?.external);

		// 		const linked_units =
		// 		[
		// 			`${ source_files_internal.map((file) => `$(BUILD)/internal/${ o }/${ file }.${ o }`).join(' ') }`,
		// 			`${ source_files_external.map((file) => `$(BUILD)/external/${ o }/${ file }.${ o }`).join(' ') }`,
		// 			`${
		// 				static_libraries
		// 					.map
		// 					(
		// 						(file) =>
		// 						{
		// 							return `${ file.library || file }.${ a }`
		// 						},
		// 					)
		// 					.join(' ')
		// 			}`,
		// 		].join(' ');

		// 		let out = '';

		// 		out += `$(BUILD)/output/${ a }/${ target_name }.${ a } : ${ linked_units }\n`;

		// 		out += `\t${ mkdir(`$(BUILD)/output/${ a }`) } && ${ mkdir(`$(BUILD)/output/${ s }`) } && `;
		// 		out += `\t${ mkdir(`$(BUILD)/output/${ a }`) } && `;

		// 		out += `${ BUILDER } ${ linked_units } ${ BUILDER_ARG } -o $(BUILD)/output/${ a }/${ target_name }.${ a }`;

		// 		out += ` && wasm-decompile $(BUILD)/output/${ a }/${ target_name }.${ a } -o $(BUILD)/output/${ s }/${ target_name }.${ s }`;

		// 		// this.output += `${ out }\n\n`;
		// 		this.output = `${ out }\n\n${ this.output }`;
		// 	};

		// 	break;

		// default:
		// }



		{
			let out = '';
			let system_libraries = null;
			let linked_units = null;



			const doCommon = (_options) =>
			{
				system_libraries = makeArray(_options?.system_libraries);
				const source_files_internal = makeArray(_options?.source_files?.internal);
				const source_files_external = makeArray(_options?.source_files?.external);
				const static_libraries = makeArray(_options?.static_libraries);

				linked_units =
				[
					`${ source_files_internal.map((file) => `$(BUILD)/internal/${ o }/${ file }.${ o }`).join(' ') }`,
					`${ source_files_external.map((file) => `$(BUILD)/external/${ o }/${ file }.${ o }`).join(' ') }`,
					`${
						static_libraries
							.map
							(
								(file) =>
								{
									if (file.watch)
									{
										for (const key in _options.variables)
										{
											file.watch = replaceVar(file.watch, key, _options.variables[key]);
										}

										_options.static_library_dependencies.push
										(
											`${ file.library }.${ a } : ${ collectFiles(file.watch, _options.variables).join(' ') }\n\t${ file.do }\n\n`,
										);
									}

									return `${ file.library || file }.${ a }`
								},
							)
							.join(' ')
					}`,
				].join(' ');
			};



			const doCommonStatic = (target_name, _options) =>
			{
				doCommon(_options);

				out += `$(BUILD)/output/${ a }/${ target_name }.${ a } : ${ linked_units }\n`;

				out += `\t${ mkdir(`$(BUILD)/output/${ a }`) } && ${ mkdir(`$(BUILD)/output/${ s }`) } && `;

				// return out;
			};



			this.linkStatic = (target_name, _options) =>
			{
				doCommonStatic(target_name, _options);

				switch (this.env)
				{
				case GCC_X64:
				{
					out += `${ BUILDER } ${ linked_units } ${ system_libraries.map((lib) => `-l ${ lib }`).join(' ') } ${ BUILDER_ARG } -o $(BUILD)/output/${ a }/${ target_name }.${ a }`;

					out += ` && objdump -d -M intel -S $(BUILD)/output/${ a }/${ target_name }.${ a } > $(BUILD)/output/${ s }/${ target_name }.${ s }`;

					break;
				}

				case MSVS_X64:
				{
					out += `${ BUILDER } ${ linked_units } ${ system_libraries.join(' ') } ${ BUILDER_ARG } /OUT:$(BUILD)/output/${ a }/${ target_name }.${ a }`;

					out += ` && dumpbin /disasm $(BUILD)/output/${ a }/${ target_name }.${ a } /out:$(BUILD)/output/${ s }/${ target_name }.${ s }`;

					break;
				}

				case EMCC_X64:
				{
					out += `${ BUILDER } ${ linked_units } ${ BUILDER_ARG } -o $(BUILD)/output/${ a }/${ target_name }.${ a }`;

					break;
				}

				case LLVM_WASM_X64:
				{
					out += `${ BUILDER } ${ linked_units } ${ BUILDER_ARG } -o $(BUILD)/output/${ a }/${ target_name }.${ a }`;

					out += ` && wasm-decompile $(BUILD)/output/${ a }/${ target_name }.${ a } -o $(BUILD)/output/${ s }/${ target_name }.${ s }`;

					break;
				}

				default:
				}

				this.output = `${ out }\n\n${ this.output }`;
			};



			const doCommonBin = (target_name, _options) =>
			{
				// system_libraries = makeArray(_options?.system_libraries);
				// const static_libraries = makeArray(_options?.static_libraries);
				// const source_files_internal = makeArray(_options?.source_files?.internal);
				// const source_files_external = makeArray(_options?.source_files?.external);

				// linked_units =
				// [
				// 	`${ source_files_internal.map((file) => `$(BUILD)/internal/${ o }/${ file }.${ o }`).join(' ') }`,
				// 	`${ source_files_external.map((file) => `$(BUILD)/external/${ o }/${ file }.${ o }`).join(' ') }`,
				// 	`${
				// 		static_libraries
				// 			.map
				// 			(
				// 				(file) =>
				// 				{
				// 					if (file.watch)
				// 					{
				// 						for (const key in _options.variables)
				// 						{
				// 							file.watch = replaceVar(file.watch, key, _options.variables[key]);
				// 						}

				// 						_options.static_library_dependencies.push
				// 						(
				// 							`${ file.library }.${ a } : ${ collectFiles(file.watch, _options.variables).join(' ') }\n\t${ file.do }\n\n`,
				// 						);
				// 					}

				// 					return `${ file.library || file }.${ a }`
				// 				},
				// 			)
				// 			.join(' ')
				// 	}`,
				// ].join(' ');

				doCommon(_options);

				out += `$(BUILD)/output/${ bin }/${ target_name }.${ bin } : ${ linked_units }\n`;

				out += `\t${ mkdir(`$(BUILD)/output/${ bin }`) } && ${ mkdir(`$(BUILD)/output/${ s }`) } && `;

				// return out;
			};



			this.linkBin = (target_name, _options) =>
			{
				doCommonBin(target_name, _options);

				switch (this.env)
				{
				case GCC_X64:
				{
					out += `${ LINKER } ${ linked_units } ${ system_libraries.map((lib) => `-l ${ lib }`).join(' ') } ${ LINKER_ARG } -o $(BUILD)/output/${ bin }/${ target_name }.${ bin }`;

					out += ` && objdump -d -M intel -S $(BUILD)/output/${ bin }/${ target_name }.${ bin } > $(BUILD)/output/${ s }/${ target_name }.${ s }`;

					break;
				}

				case MSVS_X64:
				{
					out += `${ LINKER } ${ linked_units } ${ system_libraries.join(' ') } ${ LINKER_ARG } /OUT:$(BUILD)/output/${ bin }/${ target_name }.${ bin }`;

					out += ` && dumpbin /disasm $(BUILD)/output/${ bin }/${ target_name }.${ bin } /out:$(BUILD)/output/${ s }/${ target_name }.${ s }`;

					break;
				}

				case EMCC_X64:
				{
					out += `${ LINKER } ${ linked_units } ${ LINKER_ARG } -o $(BUILD)/output/${ bin }/${ target_name }.${ bin }`;

					break;
				}

				case LLVM_WASM_X64:
				{
					out += `${ LINKER } ${ linked_units } ${ LINKER_ARG } -o $(BUILD)/output/${ bin }/${ target_name }.${ bin }`;

					out += ` && wasm-decompile $(BUILD)/output/${ bin }/${ target_name }.${ bin } -o $(BUILD)/output/${ s }/${ target_name }.${ s }`;

					break;
				}

				default:
				}

				this.output = `${ out }\n\n${ this.output }`;
			};
		}
	}

	create (options)
	{
		const build_type = options?.build_type || 'bin';
		const target_name = options?.target_name || 'build';

		const source_files = { internal: [], external: [] };
		const static_libraries = [];
		const static_library_dependencies = [];
		const include_directories = makeArray(options?.include_directories);
		const system_libraries = makeArray(options?.system_libraries);

		[ 'internal', 'external' ].forEach((location) =>
		{
			if (options?.source_files?.[location]?.cpp)
			{
				const files = makeArray(options.source_files[location].cpp);

				files.forEach
				(
					(file) =>
					{
						if (typeof file === 'string')
						{
							const { dir, name } = path.parse(file);

							source_files[location].push(`${ dir }/${ name }`);

							this.cpp(file, [], include_directories, [], location);
						}
						else if (typeof file === 'object')
						{
							const { dir, name } = path.parse(file.source);

							source_files[location].push(`${ dir }/${ name }`);

							this.cpp(file.source, makeArray(file.headers), include_directories, makeArray(file.include_directories), location, file.flags);

							if (file.custom_dependencies)
							{
								const custom = makeArray(file.custom_dependencies);

								custom.forEach
								(
									(elm) =>
									{
										this.output += `${ elm.join('') }\n\n`;
									},
								);
							}
						}
					},
				);
			}

			if (options?.source_files?.[location]?.asm)
			{
				const files = makeArray(options.source_files[location].asm);

				files.forEach
				(
					(file) =>
					{
						if (typeof file === 'string')
						{
							const { dir, name } = path.parse(file);

							source_files[location].push(`${ dir }/${ name }`);

							this.asm(file, location);
						}
						else if (typeof file === 'object')
						{
							const { dir, name } = path.parse(file.source);

							source_files[location].push(`${ dir }/${ name }`);

							this.asm(file.source, location);

							if (file.custom_dependencies)
							{
								const custom = makeArray(file.custom_dependencies);

								custom.forEach
								(
									(elm) =>
									{
										this.output += `${ elm.join('') }\n\n`;
									},
								);
							}
						}
					},
				);
			}
		});

		if (options?.static_libraries)
		{
			static_libraries.push(...makeArray(options.static_libraries));
		}



		const variables = {};

		if (options?.variables?.[this.env])
		{
			for (const key in options.variables[this.env])
			{
				variables[`$(${ key })`] = options.variables[this.env][key];
			}
		}

		if (build_type === 'static')
		{
			this.linkStatic
			(
				target_name,

				{
					source_files,
					static_libraries,
					static_library_dependencies,
					system_libraries,
					variables,
				},
			);
		}
		else if (build_type === 'bin')
		{
			this.linkBin
			(
				target_name,

				{
					source_files,
					static_libraries,
					static_library_dependencies,
					system_libraries,
					variables,
				},
			);
		}

		static_library_dependencies.forEach
		(
			(_item) =>
			{
				this.output += _item;
			},
		);

		// makefile variables
		this.output =
			`${
				[
					`SRC=${ this.dirname }/src`,
					`BUILD=${ this.dirname }/build/${ this.env }`,
					'CUSTOM_CPPFLAGS=',
					...(options?.variables?.[this.env] ? Object.keys(options.variables[this.env]).map((elm) => `${ elm }=${ options.variables[this.env][elm] }`) : []),
				].join('\n')
			}\n\n${ this.output }`;



		const makefiles = `${ this.dirname }/makefiles`;

		const env = `${ makefiles }/${ this.env }`;

		const makefile = `${ env }/Makefile`;

		this.output = `${ this.output.trim().replace(/( )+/g, ' ').replace(/(\/)+/g, '/').replace(/\/\$\(SRC\)\//g, '/').replace(/\/\$\(SRC\) /g, ' ') }\n`;

		// // remove build folder
		// if (fs.existsSync(`${ this.dirname }/build/${ this.env }`))
		// {
		// 	fs.rmdirSync(`${ this.dirname }/build/${ this.env }`, { recursive: true });
		// }

		if (fs.existsSync(makefiles))
		{
			if (fs.existsSync(env))
			{
				fs.rmdirSync(env, { recursive: true });
			}
		}
		else
		{
			fs.mkdirSync(makefiles);
		}

		fs.mkdirSync(env);
		fs.appendFileSync(makefile, this.output);

		const proc = child_process.exec(`make -f ${ makefile }`, { encoding: 'utf8' });

		proc.stdout.on('data', LOG);
		proc.stderr.on('data', (text) => LOG('\x1b[31m%s\x1b[0m', text));
	}
}

const [ env, file ] = process.argv.slice(2);

const dirname = file ? path.parse(file).dir : process.cwd();

const make = new Make({ env, dirname });

make.create(JSON.parse(fs.readFileSync(file || path.join(process.cwd(), 'genmake.json'), 'utf8')));
