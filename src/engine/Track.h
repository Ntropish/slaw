#pragma once

#include <vector>
#include <napi.h>

typedef struct Note
{
  int pitch;
  int velocity;
} Note;

class Track : public Napi::ObjectWrap<Track>
{
public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  Track(const Napi::CallbackInfo &info);
  void Subscribe(const Napi::CallbackInfo &info);

private:
  static Napi::FunctionReference constructor;

  Napi::Value Track::addNote(const Napi::CallbackInfo &info);
  Napi::Value Track::notesGetter(const Napi::CallbackInfo &info);
  void Track::notesSetter(const Napi::CallbackInfo &info, const Napi::Value &value);
  std::vector<Note> notes;
};
