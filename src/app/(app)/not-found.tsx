import { IconMapPinOff } from "@tabler/icons-react";
import Link from "next/link";
import { OpenSearchButton } from "@/components/dashboard/open-search-button";
import { StateScreen } from "@/components/shared/state-screen";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <StateScreen
      icon={IconMapPinOff}
      label="404"
      title="We couldn't find that place"
      actions={
        <>
          <OpenSearchButton label="Search for a place" />
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </>
      }
    >
      <p>The link may be out of date, or the place may not exist. Search for a city to find it.</p>
    </StateScreen>
  );
}
