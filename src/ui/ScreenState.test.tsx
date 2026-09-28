import { render } from "@testing-library/react-native";
import { Text } from "react-native";
import { ScreenState } from "./ScreenState";

describe("ScreenState", () => {
  it("shows a loading indicator and accessible label", async () => {
    const view = await render(<ScreenState state="loading" />);
    expect(view.getByLabelText("Loading")).toBeTruthy();
    expect(view.getByText("Loading…")).toBeTruthy();
  });

  it("keeps error feedback visible and announces it", async () => {
    const view = await render(
      <ScreenState state="error" message="Connection lost" />,
    );
    expect(view.getByRole("alert").props.children).toBe("Connection lost");
  });

  it("shows content only when ready", async () => {
    const view = await render(
      <ScreenState state="empty">
        <Text>Private grades</Text>
      </ScreenState>,
    );
    expect(view.queryByText("Private grades")).toBeNull();
    await view.rerender(
      <ScreenState state="ready">
        <Text>Private grades</Text>
      </ScreenState>,
    );
    expect(view.getByText("Private grades")).toBeTruthy();
  });
});
