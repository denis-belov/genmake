#!/usr/bin/env node



/*
eslint-disable

max-len,
max-params,
max-statements,
no-lone-blocks,
*/



// do flags_only, flags_override



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



// compile constants
const GCC_X64 = 'gcc-x64';
const MSVS_X64 = 'msvs-x64';
const EMCC_X64 = 'emcc-x64';
const LLVM_WASM_X64 = 'llvm-wasm-x64';



class Make
{
	constructor (options)
	{
		this.env = options?.env || GCC_X64;
		this.dirname = options?.dirname || '';



		// compiler prefixes

		// include

		let INC = null;

		switch (this.env)
		{
		case GCC_X64:
		case LLVM_WASM_X64:
		case EMCC_X64:

			INC = '-I ';

			break;

		case MSVS_X64:

			INC = '/I';

			break;

		default:
		}

		this.INC = INC;



		// output object

		let OUT_OBJ = null;

		switch (this.env)
		{
		case GCC_X64:
		case LLVM_WASM_X64:
		case EMCC_X64:

			OUT_OBJ = '-o ';

			break;

		case MSVS_X64:

			OUT_OBJ = '/Fo';

			break;

		default:
		}

		this.OUT_OBJ = OUT_OBJ;



		// output binary

		let OUT_BIN = null;

		switch (this.env)
		{
		case GCC_X64:
		case LLVM_WASM_X64:
		case EMCC_X64:

			OUT_BIN = '-o ';

			break;

		case MSVS_X64:

			OUT_BIN = '/OUT:';

			break;

		default:
		}

		this.OUT_BIN = OUT_BIN;



		// file extensions. RENAME!

		// static library files

		let a = null;

		switch (this.env)
		{
		case GCC_X64:

			a = 'a';

			break;

		case LLVM_WASM_X64:
		case EMCC_X64:

			a = 'o';

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

		this.o = o;



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



		// binary files

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

		this.bin = bin;



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

		this.ASSEMBLER = ASSEMBLER;



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

		this.C_COMPILER = C_COMPILER;

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

			// C_COMPILER_ARG = '-c --target=wasm32 --no-standard-libraries -Wall -Wextra -Wpedantic';
			C_COMPILER_ARG = '-c --target=wasm32 -Wall -Wextra -Wpedantic';

			break;

		default:
		}

		this.C_COMPILER_ARG = C_COMPILER_ARG;



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

		this.CPP_COMPILER = CPP_COMPILER;

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

			// CPP_COMPILER_ARG = '-c -std=c++20 --target=wasm32 -O3 -msimd128 --no-standard-libraries -Wall -Wextra -Wpedantic';
			CPP_COMPILER_ARG = '-c -std=c++20 --target=wasm32 -O3 -msimd128 -Wall -Wextra -Wpedantic';

			break;

		default:
		}

		this.CPP_COMPILER_ARG = CPP_COMPILER_ARG;



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

			BUILDER = 'wasm-ld';

			break;

		case LLVM_WASM_X64:

			BUILDER = 'wasm-ld';

			break;

		default:
		}

		this.BUILDER = BUILDER;

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

			BUILDER_ARG = '-r -mwasm32 --export-all --no-entry';

			break;

		case LLVM_WASM_X64:

			BUILDER_ARG = '-r -mwasm32 --export-all --no-entry';

			break;

		default:
		}

		this.BUILDER_ARG = BUILDER_ARG;



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

		this.LINKER = LINKER;

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
				'-s ASSERTIONS=0',
				'-s DISABLE_EXCEPTION_CATCHING=1',
				'-s USE_WEBGPU=1',
			].join(' ');

			break;

		case LLVM_WASM_X64:

			LINKER_ARG = '-mwasm32 --export-all --no-entry';

			break;

		default:
		}

		this.LINKER_ARG = LINKER_ARG;



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

		this.MAKE_TOOL = MAKE_TOOL;



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

		this.mkdir = mkdir;
	}



	// make includes overriding possibility
	// make specific compiler arguments and arguments overriding possibility
	cpp (entry, head_entry, location)
	{
		const { dir, ext } = path.parse(entry.file);

		let output = '';

		output += `$(BUILD)/${ location }/${ this.o }/${ entry.file }.${ this.o } : ${ entry.file } ${ entry.watch_files.map((_item) => _item.file || _item).join(' ') } ${ entry.watch_directories }\n`;

		output += `\t${ this.mkdir(`$(BUILD)/${ location }/${ this.o }/${ dir }`) } && ${ this.mkdir(`$(BUILD)/${ location }/${ this.s }/${ dir }`) } && `;

		output += `${ C_EXT.includes(ext) ? this.C_COMPILER : this.CPP_COMPILER } ${ entry.file } ${ C_EXT.includes(ext) ? this.C_COMPILER_ARG : `${ this.CPP_COMPILER_ARG }` } ${ head_entry.flags_additional } ${ entry.flags_additional } ${ head_entry.include_directories.map((include) => `${ this.INC }${ include }`).join(' ') } ${ entry.include_directories.map((include) => `${ this.INC }${ include }`).join(' ') } ${ this.OUT_OBJ }$(BUILD)/${ location }/${ this.o }/${ entry.file }.${ this.o }`;

		switch (this.env)
		{
		case GCC_X64:
		{
			output += ` && objdump -d -M intel -S $(BUILD)/${ location }/${ this.o }/${ entry.file }.${ this.o } > $(BUILD)/${ location }/${ this.s }/${ entry.file }.${ this.o }.${ this.s }`;

			break;
		}

		case MSVS_X64:
		{
			output += ` /FA /Fa$(BUILD)/${ location }/${ this.s }/${ entry.file }.${ this.o }.${ this.s }`;

			break;
		}

		case EMCC_X64:
		{
			// emcc object file to (?) assembly

			break;
		}

		case LLVM_WASM_X64:
		{
			// clang object file to llvm assembly

			break;
		}

		default:
		}

		return output;
	}



	asm (entry, location)
	{
		const { dir } = path.parse(entry.file);

		let output = '';

		output += `$(BUILD)/${ location }/${ this.o }/${ entry.file }.${ this.o } : ${ entry.file }\n`;

		output += `\t${ this.mkdir(`$(BUILD)/${ location }/${ this.o }/${ dir }`) } && `;

		output += `${ this.ASSEMBLER } ${ entry.file } ${ this.ASSEMBLER_ARG } ${ this.OUT_OBJ }$(BUILD)/${ location }/${ this.o }/${ entry.file }.${ this.o }`;

		return output;
	}



	static (entry)
	{
		let output = '';

		output += `$(BUILD)/output/${ this.a }/${ entry.name }.${ this.a } : ${ entry.watch_files2.join(' ') }\n`;

		output += `\t${ this.mkdir(`$(BUILD)/output/${ this.a }`) } && ${ this.mkdir(`$(BUILD)/output/${ this.s }`) } && `;

		switch (this.env)
		{
		case GCC_X64:
		{
			output += `${ this.BUILDER } ${ entry.watch_files2.join(' ') } ${ this.BUILDER_ARG } ${ this.OUT_BIN }$(BUILD)/output/${ this.a }/${ entry.name }.${ this.a }`;

			output += ` && objdump -d -M intel -S $(BUILD)/output/${ this.a }/${ entry.name }.${ this.a } > $(BUILD)/output/${ this.s }/${ entry.name }.${ this.s }`;

			break;
		}

		case MSVS_X64:
		{
			output += `${ this.BUILDER } ${ entry.watch_files2.join(' ') } ${ this.BUILDER_ARG } ${ this.OUT_BIN }$(BUILD)/output/${ this.a }/${ entry.name }.${ this.a }`;

			output += ` && dumpbin /disasm $(BUILD)/output/${ this.a }/${ entry.name }.${ this.a } /out:$(BUILD)/output/${ this.s }/${ entry.name }.${ this.s }`;

			break;
		}

		case EMCC_X64:
		{
			output += `${ this.BUILDER } ${ entry.watch_files2.join(' ') } ${ this.BUILDER_ARG } ${ this.OUT_BIN }$(BUILD)/output/${ this.a }/${ entry.name }.${ this.a }`;

			break;
		}

		case LLVM_WASM_X64:
		{
			output += `${ this.BUILDER } ${ entry.watch_files2.join(' ') } ${ this.BUILDER_ARG } ${ this.OUT_BIN }$(BUILD)/output/${ this.a }/${ entry.name }.${ this.a }`;

			output += ` && wasm-decompile $(BUILD)/output/${ this.a }/${ entry.name }.${ this.a } -o $(BUILD)/output/${ this.s }/${ entry.name }.${ this.s }`;

			break;
		}

		default:
		}

		return output;
	}



	binary (entry)
	{
		let output = '';

		output += `$(BUILD)/output/${ this.bin }/${ entry.name }.${ this.bin } : ${ entry.watch_files2.join(' ') }\n`;

		output += `\t${ this.mkdir(`$(BUILD)/output/${ this.bin }`) } && ${ this.mkdir(`$(BUILD)/output/${ this.s }`) } && `;

		switch (this.env)
		{
		case GCC_X64:
		{
			output += `${ this.LINKER } ${ entry.watch_files2.join(' ') } ${ entry.system_libraries.map((lib) => `-l ${ lib }`).join(' ') } ${ this.LINKER_ARG } ${ this.OUT_BIN }$(BUILD)/output/${ this.bin }/${ entry.name }.${ this.bin }`;

			output += ` && objdump -d -M intel -S $(BUILD)/output/${ this.bin }/${ entry.name }.${ this.bin } > $(BUILD)/output/${ this.s }/${ entry.name }.${ this.s }`;

			break;
		}

		case MSVS_X64:
		{
			output += `${ this.LINKER } ${ entry.watch_files2.join(' ') } ${ entry.system_libraries.join(' ') } ${ this.LINKER_ARG } ${ this.OUT_BIN }$(BUILD)/output/${ this.bin }/${ entry.name }.${ this.bin }`;

			output += ` && dumpbin /disasm $(BUILD)/output/${ this.bin }/${ entry.name }.${ this.bin } /out:$(BUILD)/output/${ this.s }/${ entry.name }.${ this.s }`;

			break;
		}

		case EMCC_X64:
		{
			output += `${ this.LINKER } ${ entry.watch_files2.join(' ') } ${ this.LINKER_ARG } ${ this.OUT_BIN }$(BUILD)/output/${ this.bin }/${ entry.name }.${ this.bin }`;

			break;
		}

		case LLVM_WASM_X64:
		{
			output += `${ this.LINKER } ${ entry.watch_files2.join(' ') } ${ this.LINKER_ARG } ${ this.OUT_BIN }$(BUILD)/output/${ this.bin }/${ entry.name }.${ this.bin }`;

			output += ` && wasm-decompile $(BUILD)/output/${ this.bin }/${ entry.name }.${ this.bin } -o $(BUILD)/output/${ this.s }/${ entry.name }.${ this.s }`;

			break;
		}

		default:
		}

		return output;
	}



	create (options)
	{
		options.entries = makeArray(options.entries);

		const variables = {};

		if (options.variables?.[this.env])
		{
			for (const key in options.variables[this.env])
			{
				variables[`$(${ key })`] = options.variables[this.env][key];
			}
		}

		// entry is each item in "watch_files" collection
		// head entry is each item in "entries" collection
		const statements =
		[
			`ENV=${ this.env }
SRC=${ this.dirname }/src
BUILD=${ this.dirname }/build/$(ENV)
${ (options?.variables?.[this.env] ? Object.keys(options.variables[this.env]).map((elm) => `${ elm }=${ options.variables[this.env][elm] }`) : []).join('\n') }`,
		];

		const parseEntry = (entry, head_entry) =>
		{
			if (typeof entry === 'string')
			{
				entry = { file: entry };
			}

			entry.include_directories = makeArray(entry.include_directories);
			entry.watch_files = makeArray(entry.watch_files);
			entry.watch_directories = makeArray(entry.watch_directories);

			entry.watch_directories =
				entry.watch_directories.map
				(
					(directory) =>
					{
						for (const key in variables)
						{
							directory = replaceVar(directory, key, variables[key]);
						}

						return directory;
					},
				);

			entry.watch_directories =
				entry.watch_directories.map((directory) => collectFiles(directory, variables).join(' ')).join(' ');

			entry.flags_additional = entry.flags_additional || '';

			if (entry.type === 'static' || entry.type === 'bin')
			{
				entry.name = entry.name || 'build';
				entry.system_libraries = makeArray(entry.system_libraries);

				entry.watch_files2 =
					entry.watch_files.map
					(
						(_item) =>
						{
							const file = _item.file || _item;

							const { ext } = path.parse(file);

							if (ext === '.c' || ext === '.cpp' || ext === '.s' || ext === '.asm')
							{
								const location = file.includes('$(SRC)') ? 'internal' : 'external';

								return `$(BUILD)/${ location }/${ this.o }/${ file }.${ this.o }`;
							}

							return file;
						},
					);

				if (entry.type === 'static')
				{
					statements.push(this.static(entry));
				}
				else if (entry.type === 'bin')
				{
					statements.push(this.binary(entry));
				}
			}
			else
			{
				const { ext } = path.parse(entry.file);

				if (ext.match(/\.(cc|cpp|c)/g))
				{
					const location = entry.file.includes('$(SRC)') ? 'internal' : 'external';

					statements.push
					(
						this.cpp
						(
							entry,
							head_entry,
							location,
						),
					);
				}
				else if (ext.match(/\.(s|asm|\$\(ASM_EXT\))/g))
				{
					const location = entry.file.includes('$(SRC)') ? 'internal' : 'external';

					statements.push
					(
						this.asm
						(
							entry,
							location,
						),
					);
				}
				else if (entry.do)
				{
					if (typeof entry.do === 'object')
					{
						entry.do = entry.do.join('');
					}

					let out = '';

					out += `${ entry.file } : ${ entry.watch_files.map((_item) => _item.file || _item).join(' ') } ${ entry.watch_directories }\n`;

					out += `\t${ entry.do }`;

					statements.push(out);
				}
			}

			entry.watch_files.map((_entry) => parseEntry(_entry, head_entry));
		};

		makeArray(options.entries[0]).forEach((entry) => parseEntry(entry, entry));

		statements[0] +=
			`\nASM_EXT=${ this.s }
LIB_EXT=${ this.a }`;

		const makefiles = `${ this.dirname }/makefiles`;

		const env = `${ makefiles }/${ this.env }`;

		const makefile = `${ env }/Makefile`;

		let output =
			statements
				.join('\n\n')
				.trim()
				.replace(/( )+/g, ' ')
				.replace(/(\/)+/g, '/')
				.replace(/\/\$\(SRC\)\//g, '/')
				.replace(/\/\$\(SRC\) /g, ' ');

		output = `${ output }\n`;

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
		fs.appendFileSync(makefile, output);

		const proc = child_process.exec(`${ this.MAKE_TOOL } -f ${ makefile }`, { encoding: 'utf8' });

		proc.stdout.on('data', LOG);
		proc.stderr.on('data', (text) => LOG('\x1b[31m%s\x1b[0m', text));
	}
}

const [ env, file ] = process.argv.slice(2);

const dirname = file ? path.parse(file).dir : process.cwd();

const make = new Make({ env, dirname });

make.create(JSON.parse(fs.readFileSync(file || path.join(process.cwd(), 'genmake.json'), 'utf8')));
