import { notFound } from "next/navigation";

// Unknown URLs land here so the not-found page keeps the app shell (a root not-found would not).
export default function UnknownPage() {
  notFound();
}
