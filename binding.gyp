{
    "targets": [
        {
            "target_name": "engine",
            "sources": [ "./src/engine/engine.cc", "./src/engine/Track.cc" ],
            "include_dirs": ["<!@(node -p \"require('node-addon-api').include\")", "C:\dev\midifile\include"],
            "dependencied": ["<!(node -p \"require('node-addon-api').gyp\")"],
            'cflags!': [ '-fno-exceptions' ],
            'cflags_cc!': [ '-fno-exceptions' ],
            'xcode_settings': {
                'GCC_ENABLE_CPP_EXCEPTIONS': 'YES',
                'CLANG_CXX_LIBRARY': 'libc++',
                'MACOSX_DEPLOYMENT_TARGET': '10.7',
            },
            'msvs_settings': {
                'VCCLCompilerTool': { 'ExceptionHandling': 1 },
            },
            "libraries": [
                "../src/engine/lib/midifile.lib"
            ]
        }
    ]
}