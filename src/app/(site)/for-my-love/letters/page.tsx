import { permanentRedirect } from "next/navigation";

/** The catalogue lives on the For My Love page; this address is only a friendlier way to reach it. */
export default function LettersIndex() {
  permanentRedirect("/for-my-love#all-letters");
}
