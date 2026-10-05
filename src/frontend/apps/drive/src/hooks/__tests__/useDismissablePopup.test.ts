import { useDismissablePopup } from "../useDismissablePopup";

// Jest runs in a node environment here (no DOM, no testing-library), so the
// effect is captured and run by hand against a minimal fake `document`.
const effects: Array<() => void | (() => void)> = [];
jest.mock("react", () => ({
  useEffect: (effect: () => void | (() => void)) => {
    effects.push(effect);
  },
}));

type Listener = (e: { key: string; target?: unknown }) => void;
const listeners: Record<string, Set<Listener>> = {};
const fakeDocument = {
  addEventListener: (type: string, fn: Listener) => {
    (listeners[type] ??= new Set()).add(fn);
  },
  removeEventListener: (type: string, fn: Listener) => {
    listeners[type]?.delete(fn);
  },
};

const pressEscape = () =>
  [...(listeners.keydown ?? [])].forEach((fn) => fn({ key: "Escape" }));

// Mounts one popup the way a component would: the hook registers its effect,
// which we then run; the returned function is the effect's cleanup.
const mount = (isOpen: boolean, setIsOpen: (open: boolean) => void) => {
  effects.length = 0;
  // eslint-disable-next-line react-hooks/rules-of-hooks -- effects are captured and run by hand
  useDismissablePopup(
    { current: null },
    { current: { focus: jest.fn() } as unknown as HTMLElement },
    isOpen,
    setIsOpen
  );
  const cleanup = effects[0]?.();
  return typeof cleanup === "function" ? cleanup : () => {};
};

describe("useDismissablePopup", () => {
  const cleanups: Array<() => void> = [];

  beforeAll(() => {
    (globalThis as { document?: unknown }).document = fakeDocument;
  });
  afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()));
  afterAll(() => {
    delete (globalThis as { document?: unknown }).document;
  });

  const open = (setIsOpen: (open: boolean) => void) => {
    const cleanup = mount(true, setIsOpen);
    cleanups.push(cleanup);
    return cleanup;
  };

  it("closes a single open popup on Escape", () => {
    const close = jest.fn();
    open(close);
    pressEscape();
    expect(close).toHaveBeenCalledWith(false);
  });

  it("ignores Escape while closed", () => {
    const close = jest.fn();
    mount(false, close);
    pressEscape();
    expect(close).not.toHaveBeenCalled();
  });

  it("closes only the most recently opened popup per Escape", () => {
    const first = jest.fn();
    const second = jest.fn();
    open(first);
    const closeSecond = open(second);

    pressEscape();
    expect(second).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();

    closeSecond();
    pressEscape();
    expect(first).toHaveBeenCalledTimes(1);
  });
});
