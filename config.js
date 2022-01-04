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
		/**
		 * export CLANG_VERSION=12
		 * export LLD_VERSION=12
		 * export WASI_VERSION=12
		 * export WASI_VERSION_FULL=${WASI_VERSION}.0
		 * sudo apt install make
		 * sudo apt install clang-${CLANG_VERSION} // clang, clang++
		 * sudo apt install lld-${LLD_VERSION} // wasm-ld
		 * sudo update-alternatives --install /usr/bin/clang clang /usr/bin/clang-${CLANG_VERSION} 100
		 * sudo update-alternatives --install /usr/bin/clang++ clang++ /usr/bin/clang++-${CLANG_VERSION} 100
		 * sudo update-alternatives --install /usr/bin/wasm-ld wasm-ld /usr/bin/wasm-ld-${LLD_VERSION} 100
		 * wget https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-${WASI_VERSION}/wasi-sdk-${WASI_VERSION_FULL}-linux.tar.gz
		 * tar xvf wasi-sdk-${WASI_VERSION_FULL}-linux.tar.gz
		 */

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

		// a: 'o',
		a: 'a',

		o: 'o',

		s: 'dcmp',

		bin: 'wasm',

		// C_COMPILER: 'clang',
		C_COMPILER: '/home/denis/lib/wasi-sdk-14.0/bin/clang',

		C_COMPILER_ARG: '--target=wasm32-unknown-wasi-unknown -error-limit=0 -fno-exceptions -mthread-model single --sysroot=/home/denis/lib/wasi-sdk-14.0/share/wasi-sysroot',

		// CPP_COMPILER: 'clang++',
		CPP_COMPILER: '/home/denis/lib/wasi-sdk-14.0/bin/clang++',

		// CPP_COMPILER_ARG: '--target=wasm32-unknown-wasi-unknown -I /usr/include/c++/10 -I /usr/include -I /usr/include/x86_64-linux-gnu -I /usr/include/x86_64-linux-gnu/c++/10',
		CPP_COMPILER_ARG: '--target=wasm32-unknown-wasi-unknown -error-limit=0 -fno-exceptions -mthread-model single --sysroot=/home/denis/lib/wasi-sdk-14.0/share/wasi-sysroot',

		// BUILDER: 'wasm-ld',
		BUILDER: '/home/denis/lib/wasi-sdk-14.0/bin/wasm-ld',
		// BUILDER: 'clang++',

		BUILDER_ARG: '-r -mwasm32 -error-limit=0 --export-all --no-entry --allow-undefined --no-check-features',
		// BUILDER_ARG: '-Wl,-r -Wl,-mwasm32 -Wl,-error-limit=0 -Wl,--export-all -Wl,--no-entry -Wl,--allow-undefined --target=wasm32-unknown-wasi-unknown -error-limit=0 -fno-exceptions -mthread-model single --sysroot=/home/denis/lib/wasi-sdk-14.0/share/wasi-sysroot',

		// LINKER: 'wasm-ld',
		LINKER: '/home/denis/lib/wasi-sdk-14.0/bin/wasm-ld',

		LINKER_ARG: '-mwasm32 -error-limit=0 --export-all --no-entry --allow-undefined --no-check-features --import-memory --shared-memory --max-memory=131072 -L /home/denis/lib/wasi-sdk-14.0/share/wasi-sysroot/lib/wasm32-wasi -lc -lc++ -lc++abi',
		// LINKER_ARG: '-mwasm32 -error-limit=0 --export-all --no-entry -L /lib/llvm-12/lib -lc++',
	},

	'gcc-x64':
	{
		/**
		 * sudo apt install make
		 * sudo apt install gcc-10
		 * sudo apt install g++-10
		 * sudo update-alternatives --install /usr/bin/gcc gcc /usr/bin/gcc-10 100
		 * sudo update-alternatives --install /usr/bin/g++ g++ /usr/bin/g++-10 100
		 * sudo apt install ld
		 */

		UNIFORM_ARG:
		[
			'NO_LINK=-c',

			'VERBOSE:=-Wall -Wextra -Wabi -Wpedantic -v',

			'NO_STD=--no-standard-libraries',

			'OPT_SLOW=-O1',

			'OPT_MEDIUM=-O2',

			'OPT_FAST=-O3',

			'OPT_SIZE=-Os',

			'OPT_FASTX=-Ofast -funroll-loops', // TODO: add more performance args

			'STD_20=-std=c++20',

			'SSE=-msse3',
		],

		INC: '-I ',

		PREF_OUT_OBJ: '-o ',

		PREF_OUT_BIN: '-o ',

		a: 'a',

		o: 'o',

		s: 's',

		bin: 'bin',

		C_COMPILER: 'gcc',

		C_COMPILER_ARG: '-m64 -error-limit=0',

		CPP_COMPILER: 'g++',

		CPP_COMPILER_ARG: '-m64 -error-limit=0',

		BUILDER: 'ld',

		BUILDER_ARG: '-r -flto',

		LINKER: 'g++',

		LINKER_ARG: '-flto --verbose',
	},
};
