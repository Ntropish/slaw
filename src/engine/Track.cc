#include "Track.h"
#include "napi.h"

Napi::FunctionReference Track::constructor;

Napi::Object Track::Init(Napi::Env env, Napi::Object exports)
{
    Napi::HandleScope scope(env);

    Napi::Function func = DefineClass(env, "Track", {InstanceMethod("addNote", &Track::addNote), InstanceAccessor("notes", &Track::notesGetter, &Track::notesSetter)});

    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();

    exports.Set("Track", func);
    return exports;
}

Track::Track(const Napi::CallbackInfo &info) : Napi::ObjectWrap<Track>(info)
{
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);
}

Napi::Value Track::notesGetter(const Napi::CallbackInfo &info)
{
    return Napi::String::New(info.Env(), "notes");
}

void Subscribe(const Napi::CallbackInfo &info)
{
    if (info.Length() <= 0 || !info[0].IsFunction())
    {
    }
    else
    {
    }
}

void Track::notesSetter(const Napi::CallbackInfo &info, const Napi::Value &value)
{
}

Napi::Value Track::addNote(const Napi::CallbackInfo &info)
{

    Napi::Number pitch;
    Napi::Number velocity;

    if (info.Length() <= 0 || !info[0].IsNumber() || !info[1].IsNumber())
    {
    }
    else
    {
        pitch = info[0].As<Napi::Number>();
        velocity = info[1].As<Napi::Number>();
    }

    Note newNote = {pitch, velocity};
    notes.push_back(newNote);
}
