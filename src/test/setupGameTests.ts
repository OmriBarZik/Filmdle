import "@/app/globals.css";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";
import { closeFilmDetails } from "@/lib/display/filmDetails";
import { installFakeAnalytics } from "@/test/fakes/fakeAnalytics";
import { installFakePosters } from "@/test/fakes/fakePosters";
import { installFakeWikipedia, removeFakeWikipedia } from "@/test/fakes/fakeWikipedia";

/** Fix "today" and start every test with an empty save, local posters and a fresh GA. */
export function setupGameTests(now = "2026-11-01T10:00:00") {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(now));
    window.localStorage.clear();
    installFakeAnalytics();
    installFakePosters();
    installFakeWikipedia();
  });
  afterEach(() => {
    cleanup();
    closeFilmDetails();
    vi.useRealTimers();
    delete window.gtag;
    removeFakeWikipedia();
  });
}
