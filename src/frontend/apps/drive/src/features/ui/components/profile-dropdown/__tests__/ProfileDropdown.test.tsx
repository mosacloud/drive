import { renderToStaticMarkup } from "react-dom/server";
import { ProfileDropdownButton } from "../ProfileDropdown";
import { User } from "@/features/auth/types";

// This suite only covers static (closed-state) rendering: jest here runs
// under `testEnvironment: "node"` (see jest.config.ts), with no DOM and no
// testing-library, so the open/close, click-outside, Escape and
// upward-flip interaction logic (all effect-driven) can't run here and is
// left to manual/browser verification.
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options && "name" in options ? `${key} ${options.name as string}` : key,
  }),
}));

const baseUser: User = {
  id: "user-1",
  email: "jane.doe@example.com",
  full_name: "Jane Doe",
  language: "en-us",
  language_confirmed_by_idp: false,
  picture: null,
  main_workspace: {} as User["main_workspace"],
};

describe("ProfileDropdownButton", () => {
  it("renders initials when the user has no picture", () => {
    const markup = renderToStaticMarkup(
      <ProfileDropdownButton user={baseUser} onLogout={() => {}} />
    );
    expect(markup).toContain("JD");
    expect(markup).not.toContain("<img");
  });

  it("renders an image when the user has a picture", () => {
    const markup = renderToStaticMarkup(
      <ProfileDropdownButton
        user={{ ...baseUser, picture: "https://example.com/avatar.png" }}
        onLogout={() => {}}
      />
    );
    expect(markup).toContain("https://example.com/avatar.png");
  });

  it("falls back to the email for initials when full_name is missing", () => {
    const markup = renderToStaticMarkup(
      <ProfileDropdownButton
        user={{ ...baseUser, full_name: null }}
        onLogout={() => {}}
      />
    );
    expect(markup).toContain("J");
  });
});
