#include <napi.h>
#include "MidiFile.h"
#include "Track.h"
#include <vector>

// smf::MidiFile midifile;
std::vector<Track> tracks;

Napi::String Method(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    printf("I've been seen");
    return Napi::String::New(env, "world");
}

Napi::Object getState(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    Napi::Object state = Napi::Object::New(env);
    return state;
}

// Object GetTracks()

Napi::Object Init(Napi::Env env, Napi::Object exports)
{

    return Track::Init(env, exports);
}

NODE_API_MODULE(engine, Init)