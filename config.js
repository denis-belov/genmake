// const platforms =
// {
// 	'linux':
// 	{
// 		MAKE_TOOL: 'make',

// 		MAKE_TOOL_INPUT_PREF: '-f',
// 	},

// 	'win32':
// 	{
// 		MAKE_TOOL: 'nmake',

// 		MAKE_TOOL_INPUT_PREF: '/F',
// 	},
// };

module.exports =
{
	'clang-wasm32':
	{
		UNIFORM_ARG:
		[
			'NO_LINK=-c',

			'VERBOSE:=-Wall -Wextra -Wabi -Wpedantic -v',

			'NO_STD=--no-standard-libraries',

			'OPT_SLOW=-O1',

			'OPT_MEDIUM=-O2',

			'OPT_FAST=-O3',

			'OPT_SIZE=-Os',

			'OPT_FASTX=-Ofast -funroll-loops',

			'STD_20=-std=c++20',

			'SSE=-msimd128',
		],

		INC: '-I ',

		PREF_OUT_OBJ: '-o ',

		PREF_OUT_BIN: '-o ',

		a: 'o',

		o: 'o',

		s: 'dcmp',

		bin: 'wasm',

		C_COMPILER: 'clang-12',

		C_COMPILER_ARG: '--target=wasm32-unknown-unknown-wasi -error-limit=0 -fno-exceptions --sysroot=/home/denis/lib/wasi-sdk-12.0/share/wasi-sysroot',

		CPP_COMPILER: 'clang++-12',

		// CPP_COMPILER_ARG: '--target=wasm32-unknown-unknown-wasi -I /usr/include/c++/10 -I /usr/include -I /usr/include/x86_64-linux-gnu -I /usr/include/x86_64-linux-gnu/c++/10',
		CPP_COMPILER_ARG: '--target=wasm32-unknown-unknown-wasi -error-limit=0 -fno-exceptions -mthread-model single --sysroot=/home/denis/lib/wasi-sdk-12.0/share/wasi-sysroot',

		BUILDER: 'wasm-ld-12',

		BUILDER_ARG: '-r -mwasm32 -error-limit=0 --export-all --no-entry --allow-undefined',

		LINKER: 'wasm-ld-12',

		LINKER_ARG: '-mwasm32 -error-limit=0 --export-all --no-entry --allow-undefined -L /home/denis/lib/wasi-sdk-12.0/share/wasi-sysroot/lib/wasm32-wasi -lc -lc++ -lc++abi',
		// LINKER_ARG: '-mwasm32 -error-limit=0 --export-all --no-entry -L /lib/llvm-12/lib -lc++',
	},
};
