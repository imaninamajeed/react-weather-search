import { Suspense } from "react";
import { getPreferences } from "@/lib/preferences";
import { InstallButton, LanguageToggle, ThemeToggle, UnitsToggle } from "./preference-toggles";

/** Units live in a cookie, so the toggle streams in behind a disabled copy of itself. */
async function Units() {
  const { units } = await getPreferences();
  return <UnitsToggle units={units} />;
}

/** The app toolbar: units, language, theme and the install button, beside search in the header. */
export function PreferenceControls() {
  return (
    <>
      <Suspense fallback={<UnitsToggle units={null} />}>
        <Units />
      </Suspense>
      <LanguageToggle />
      <ThemeToggle />
      <InstallButton />
    </>
  );
}
