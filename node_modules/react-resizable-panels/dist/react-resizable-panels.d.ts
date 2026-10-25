import { CSSProperties } from 'react';
import { Dispatch } from 'react';
import { HTMLAttributes } from 'react';
import { JSX } from 'react/jsx-runtime';
import { ReactNode } from 'react';
import { Ref } from 'react';
import { RefObject } from 'react';
import { SetStateAction } from 'react';

declare type BaseGridlineProps = {
    /**
     * Gridline contents (e.g. a drag handle icon).
     */
    children?: ReactNode | undefined;
    /**
     * CSS class name.
     *
     * ℹ️ Use the `data-separator` attribute for custom _hover_ and _active_ styles
     */
    className?: string | undefined;
    /**
     * When disabled, the gridline cannot be used to resize its neighboring tracks.
     *
     * ℹ️ The tracks may still be resized indirectly (e.g. by an intersecting gridline or another boundary).
     * To prevent a track from being resized at all, it needs to also be disabled.
     */
    disabled?: boolean | undefined;
    /**
     * Ref attached to the root `HTMLDivElement`.
     */
    elementRef?: Ref<HTMLDivElement> | undefined;
    /**
     * CSS properties.
     *
     * ⚠️ Grid placement properties are managed by the gridline and cannot be overridden.
     */
    style?: CSSProperties | undefined;
};

declare type BasePanelAttributes = Omit<HTMLAttributes<HTMLDivElement>, "onResize">;

declare type BaseSeparatorAttributes = Omit<HTMLAttributes<HTMLDivElement>, "role" | "tabIndex">;

/**
 * A Cell occupies one or more tracks (columns and rows) within a Grid.
 * Cells are resized along with the tracks they occupy.
 *
 * Cell elements always include the following attributes:
 *
 * ```html
 * <div data-cell data-testid="cell-id-prop" id="cell-id-prop">
 * ```
 *
 * ℹ️ [Test id](https://testing-library.com/docs/queries/bytestid/) can be used to narrow selection when unit testing.
 *
 * ⚠️ Cell elements must be direct DOM children of their parent Grid elements.
 */
export declare function Cell({ children, className, column, columnSpan, elementRef: elementRefProp, id: idProp, row, rowSpan, style, ...rest }: CellProps): JSX.Element;

export declare namespace Cell {
    var displayName: string;
}

export declare type CellProps = HTMLAttributes<HTMLDivElement> & {
    /**
     * Cell contents.
     */
    children?: ReactNode | undefined;
    /**
     * CSS class name.
     */
    className?: string | undefined;
    /**
     * Index of the (first) column this cell occupies.
     */
    column: number;
    /**
     * Number of columns this cell spans; defaults to 1.
     */
    columnSpan?: number | undefined;
    /**
     * Ref attached to the root `HTMLDivElement`.
     */
    elementRef?: Ref<HTMLDivElement | null> | undefined;
    /**
     * Uniquely identifies this cell within the parent grid.
     * Falls back to `useId` when not provided.
     *
     * ℹ️ This value will also be assigned to the `id` and `data-testid` attributes.
     */
    id?: string | number | undefined;
    /**
     * Index of the (first) row this cell occupies.
     */
    row: number;
    /**
     * Number of rows this cell spans; defaults to 1.
     */
    rowSpan?: number | undefined;
    /**
     * CSS properties.
     *
     * ⚠️ Grid placement properties are managed by the Cell and cannot be overridden.
     */
    style?: CSSProperties | undefined;
};

/**
 * A Grid arranges resizable Cells in two dimensions.
 * Columns can be resized horizontally and rows can be resized vertically;
 * dragging the point where a column boundary and a row boundary intersect resizes both.
 *
 * Size constraints (e.g. min/max size, collapsible) are specified per track (column or row),
 * using the same format as Panel props.
 *
 * Cells can span multiple columns and/or rows.
 * Track boundaries cannot be resized alongside of a cell that spans across them.
 *
 * Grid elements always include the following attributes:
 *
 * ```html
 * <div data-grid data-testid="grid-id-prop" id="grid-id-prop">
 * ```
 *
 * ℹ️ [Test id](https://testing-library.com/docs/queries/bytestid/) can be used to narrow selection when unit testing.
 */
export declare function Grid({ children, className, columns, defaultLayout, disableCursor, disabled, elementRef: elementRefProp, gridRef, id: idProp, onLayoutChange: onLayoutChangeUnstable, onLayoutChanged: onLayoutChangedUnstable, resizeTargetMinimumSize, rows, style, ...rest }: GridProps): JSX.Element;

export declare namespace Grid {
    var displayName: string;
}

/**
 * A Grid has two independently resizable axes:
 * - "column" tracks are resized horizontally
 * - "row" tracks are resized vertically
 */
export declare type GridAxis = "column" | "row";

/**
 * Imperative Grid API.
 *
 * ℹ️ The `useGridRef` and `useGridCallbackRef` hooks are exported for convenience use in TypeScript projects.
 */
export declare interface GridImperativeHandle {
    /**
     * Get the Grid's current layout: maps of column and row ids to percentages (0..100)
     *
     * @return Map of column ids to percentages and map of row ids to percentages (specified as numbers ranging between 0..100)
     */
    getLayout: () => {
        columns: {
            [columnId: string]: number;
        };
        rows: {
            [rowId: string]: number;
        };
    };
    /**
     * Imperative API for the column or row with the specified id (see `GridTrackImperativeHandle`).
     *
     * ℹ️ Tracks without an explicit `id` use their index (e.g. `"0"`) as their id.
     *
     * ⚠️ An error will be thrown if the Grid does not contain a matching track.
     *
     * @param axis "column" or "row"
     * @param id Track id
     */
    getTrackById: (axis: "column" | "row", id: string | number) => GridTrackImperativeHandle;
    /**
     * Imperative API for the column or row at the specified index (see `GridTrackImperativeHandle`).
     *
     * ℹ️ The index is resolved to a track id when this method is called; the returned API continues to refer to that id.
     * Tracks without an explicit `id` use their index as their id,
     * so specify ids if the API needs to refer to the same track after tracks are added or removed before it.
     *
     * ⚠️ An error will be thrown if the index is out of range.
     *
     * @param axis "column" or "row"
     * @param index Track index (starting at 0)
     */
    getTrackByIndex: (axis: "column" | "row", index: number) => GridTrackImperativeHandle;
    /**
     * Set a new layout for one or both of the Grid's axes.
     *
     * @param layout Map of column and/or row ids to percentages (numbers between 0..100)
     * @return Applied layout (after validation)
     */
    setLayout: (layout: {
        columns?: {
            [columnId: string]: number;
        } | undefined;
        rows?: {
            [rowId: string]: number;
        } | undefined;
    }) => {
        columns: {
            [columnId: string]: number;
        };
        rows: {
            [rowId: string]: number;
        };
    };
}

/**
 * Grid layouts are a pair of (1-dimensional) layouts, one per axis.
 * Each is a map of track id to percentage (0..100) of the space available to that axis.
 */
export declare type GridLayout = {
    columns: Layout;
    rows: Layout;
};

/**
 * Resizes the columns (or rows) of a Grid.
 *
 * For example:
 *
 * ```tsx
 * // Rendered between columns 0 and 1 and spans all rows
 * <Gridline type="column" column={1} />
 * ```
 *
 * ```tsx
 * // Rendered between rows 0 and 1 and spans all columns
 * <Gridline type="row" row={1} />
 * ```
 *
 * ```tsx
 * // Rendered between columns 0 and 1 alongside of row 2 only
 * <Gridline type="column" column={1} row={2} rowSpan={1} />
 * ```
 *
 * A gridline should not be rendered alongside of a Cell that spans across its boundary
 * (this includes disabled gridlines; an error will be logged to the console);
 * render multiple gridlines along the same boundary instead (e.g. before and after the spanning Cell).
 *
 * ℹ️ Once a boundary contains a gridline, it can only be resized using gridlines;
 * the parts of the boundary that aren't alongside of a gridline can't be dragged.
 *
 * Where column and row gridlines intersect, dragging resizes both axes.
 *
 * Gridlines are not _required_ but they are _recommended_ as they improve keyboard accessibility.
 *
 * Gridline elements always include the following attributes:
 *
 * ```html
 * <div aria-orientation="vertical" data-separator role="separator">
 * ```
 *
 * ℹ️ Column gridlines are vertical (`aria-orientation="vertical"`) and row gridlines are horizontal (`aria-orientation="horizontal"`).
 *
 * ℹ️ In addition to the attributes shown above, gridlines also render all required [WAI-ARIA properties](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/separator_role#associated_wai-aria_roles_states_and_properties).
 *
 * ⚠️ Gridline elements must be direct DOM children of their parent Grid elements.
 *
 * ℹ️ Gridlines rendered by another component (rather than directly within the Grid) aren't detected until they mount, so server-rendered layouts may shift slightly during hydration.
 */
export declare function Gridline(props: GridlineProps): JSX.Element;

export declare namespace Gridline {
    var displayName: string;
}

export declare type GridlineProps = BaseGridlineProps & ({
    /**
     * Column gridlines are vertical; they resize the columns on either side of them.
     * Row gridlines are horizontal; they resize the rows on either side of them.
     */
    type: "column";
    /**
     * When `type` is "column", the gridline is rendered along the leading (left) edge of this column
     * (between it and the previous column); must be greater than 0 and less than the number of columns.
     */
    column: number;
    /**
     * When `type` is "column", index of the first row the gridline is rendered alongside of; defaults to 0.
     */
    row?: number | undefined;
    /**
     * Number of rows a column gridline spans; defaults to all rows (starting from `row`).
     *
     * ℹ️ Gridlines can span a subset of rows in order to avoid cells that span across the boundary they sit on;
     * multiple gridlines can be rendered along the same boundary (e.g. above and below a spanning cell).
     */
    rowSpan?: number | undefined;
} | {
    /**
     * Column gridlines are vertical; they resize the columns on either side of them.
     * Row gridlines are horizontal; they resize the rows on either side of them.
     */
    type: "row";
    /**
     * When `type` is "row", index of the first column the gridline is rendered alongside of; defaults to 0.
     */
    column?: number | undefined;
    /**
     * Number of columns a row gridline spans; defaults to all columns (starting from `column`).
     *
     * ℹ️ Gridlines can span a subset of columns in order to avoid cells that span across the boundary they sit on;
     * multiple gridlines can be rendered along the same boundary (e.g. before and after a spanning cell).
     */
    columnSpan?: number | undefined;
    /**
     * When `type` is "row", the gridline is rendered along the leading (top) edge of this row
     * (between it and the previous row); must be greater than 0 and less than the number of rows.
     */
    row: number;
});

export declare type GridProps = HTMLAttributes<HTMLDivElement> & {
    /**
     * Cell and Gridline components that comprise this grid.
     *
     * ⚠️ Cell and Gridline elements must be direct DOM children of their parent Grid element.
     */
    children?: ReactNode | undefined;
    /**
     * CSS class name.
     */
    className?: string | undefined;
    /**
     * Grid columns; either the number of columns or an array of size constraints (one per column).
     */
    columns: number | GridTrackProps[];
    /**
     * Default layout for either or both of the Grid's axes.
     *
     * ℹ️ This value allows layouts to be remembered between page reloads.
     */
    defaultLayout?: Partial<GridLayout> | undefined;
    /**
     * This library sets custom mouse cursor styles to indicate drag state.
     * Use this prop to disable that behavior for this grid.
     */
    disableCursor?: boolean | undefined;
    /**
     * Disable resize functionality.
     */
    disabled?: boolean | undefined;
    /**
     * Ref attached to the root `HTMLDivElement`.
     */
    elementRef?: Ref<HTMLDivElement | null> | undefined;
    /**
     * Exposes the following imperative API:
     * - `getLayout(): GridLayout`
     * - `getTrackById(axis: "column" | "row", id: string | number): GridTrackImperativeHandle`
     * - `getTrackByIndex(axis: "column" | "row", index: number): GridTrackImperativeHandle`
     * - `setLayout(layout: Partial<GridLayout>): GridLayout`
     *
     * ℹ️ The `useGridRef` and `useGridCallbackRef` hooks are exported for convenience use in TypeScript projects.
     */
    gridRef?: Ref<GridImperativeHandle | null> | undefined;
    /**
     * Uniquely identifies this grid within an application.
     * Falls back to `useId` when not provided.
     *
     * ℹ️ This value will also be assigned to the `id` and `data-testid` attributes.
     */
    id?: string | number | undefined;
    /**
     * Called when the Grid's layout is changing.
     *
     * ⚠️ For layout changes caused by pointer events, this method is called each time the pointer is moved.
     * For most cases, it is recommended to use the `onLayoutChanged` callback instead.
     */
    onLayoutChange?: ((layout: GridLayout) => void) | undefined;
    /**
     * Called after the Grid's layout has been changed.
     *
     * ℹ️ For layout changes caused by pointer events, this method is not called until the pointer has been released.
     * This method is recommended when saving layouts to some storage api.
     */
    onLayoutChanged?: ((layout: GridLayout, meta: LayoutChangedMeta<GridLayout>) => void) | undefined;
    /**
     * Minimum size of the resizable hit target area (either a `Gridline` or a `Cell` edge)
     * This threshold ensures targets are large enough to avoid mis-clicks.
     *
     * ℹ️ Refer to the `Group` prop of the same name for more information.
     */
    resizeTargetMinimumSize?: {
        coarse: number;
        fine: number;
    };
    /**
     * Grid rows; either the number of rows or an array of size constraints (one per row).
     */
    rows: number | GridTrackProps[];
    /**
     * CSS properties.
     *
     * ⚠️ Grid template and display properties are managed by the Grid and cannot be overridden.
     */
    style?: CSSProperties | undefined;
};

/**
 * Imperative API for an individual Grid track (column or row); returned by `GridImperativeHandle.getTrackById` and `GridImperativeHandle.getTrackByIndex`.
 *
 * ℹ️ Sizes are relative to the space available to the track's axis
 * (e.g. the width of the Grid, minus gaps and gridlines, for a column).
 */
export declare interface GridTrackImperativeHandle {
    /**
     * Collapse the track to its `collapsedSize`.
     *
     * ⚠️ This method will do nothing if the track is not `collapsible` or if it is already collapsed.
     */
    collapse: () => void;
    /**
     * Expand a collapsed track to its most recent size.
     *
     * ⚠️ This method will do nothing if the track is not currently collapsed.
     */
    expand: () => void;
    /**
     * Get the current size of the track in pixels as well as a percentage of its axis (0..100).
     *
     * @return Track size (in pixels and as a percentage of its axis)
     */
    getSize: () => {
        asPercentage: number;
        inPixels: number;
    };
    /**
     * The track is currently collapsed.
     */
    isCollapsed: () => boolean;
    /**
     * Update the track's size.
     *
     * Size can be in the following formats:
     * - Percentage of the axis (0..100)
     * - Pixels
     * - Relative font units (em, rem)
     * - Viewport relative units (vh, vw)
     *
     * ℹ️ Numeric values are assumed to be pixels.
     * Strings without explicit units are assumed to be percentages (0%..100%).
     * Percentages may also be specified as strings ending with "%" (e.g. "33%")
     * Pixels may also be specified as strings ending with the unit "px".
     * Other units should be specified as strings ending with their CSS property units (e.g. 1rem, 50vh)
     *
     * @param size New track size
     */
    resize: (size: number | string) => void;
}

/**
 * Size constraints for a Grid track (a column or a row).
 *
 * Tracks support the same constraints as Panels,
 * using the same [interpretation rules](https://react-resizable-panels.vercel.app/examples/size-constraints):
 * - Numbers are interpreted as pixels (e.g. `minSize={200}` is 200 pixels)
 * - Strings without explicit units are interpreted as percentage (e.g. `minSize="50"` is 50 percent)
 * - Use explicit units (e.g. "px", "%", "em", "rem", "vh", or "vw") to change interpretation
 */
export declare type GridTrackProps = PanelConstraintProps & {
    /**
     * Uniquely identifies this track within its axis; defaults to the track's index.
     *
     * ℹ️ This value is used as the key for this track in the Grid's layout.
     */
    id?: string | number | undefined;
};

/**
 * A Group wraps a set of resizable Panel components.
 * Group content can be resized _horizontally_ or _vertically_.
 *
 * Group elements always include the following attributes:
 *
 * ```html
 * <div data-group data-testid="group-id-prop" id="group-id-prop">
 * ```
 *
 * ℹ️ [Test id](https://testing-library.com/docs/queries/bytestid/) can be used to narrow selection when unit testing.
 */
export declare function Group({ children, className, defaultLayout, disableCursor, disabled, elementRef: elementRefProp, groupRef, id: idProp, onLayoutChange: onLayoutChangeUnstable, onLayoutChanged: onLayoutChangedUnstable, orientation, resizePreviewMode, resizeTargetMinimumSize, style, ...rest }: GroupProps): JSX.Element;

export declare namespace Group {
    var displayName: string;
}

/**
 * Imperative Group API.
 *
 * ℹ️ The `useGroupRef` and `useGroupCallbackRef` hooks are exported for convenience use in TypeScript projects.
 */
export declare interface GroupImperativeHandle {
    /**
     * Get the Group's current layout as a map of Panel id to percentage (0..100)
     *
     * @return Map of Panel id to percentages (specified as numbers ranging between 0..100)
     */
    getLayout: () => {
        [panelId: string]: number;
    };
    /**
     * Set a new layout for the Group
     *
     * @param layout Map of Panel id to percentage (a number between 0..100)
     * @return Applied layout (after validation)
     */
    setLayout: (layout: {
        [panelId: string]: number;
    }) => Layout;
}

export declare type GroupProps = HTMLAttributes<HTMLDivElement> & {
    /**
     * Panel and Separator components that comprise this group.
     */
    children?: ReactNode | undefined;
    /**
     * CSS class name.
     */
    className?: string | undefined;
    /**
     * Default layout for the Group.
     *
     * ℹ️ This value allows layouts to be remembered between page reloads.
     *
     * ⚠️ Slight layout shift may occur when server-rendering panels with percentage-based default sizes.
     * Refer to the documentation for suggestions on how to minimize the impact of this.
     */
    defaultLayout?: Layout | undefined;
    /**
     * This library sets custom mouse cursor styles to indicate drag state.
     * Use this prop to disable that behavior for Panels and Separators in this group.
     */
    disableCursor?: boolean | undefined;
    /**
     * Disable resize functionality.
     */
    disabled?: boolean | undefined;
    /**
     * Ref attached to the root `HTMLDivElement`.
     */
    elementRef?: Ref<HTMLDivElement | null> | undefined;
    /**
     * Exposes the following imperative API:
     * - `getLayout(): Layout`
     * - `setLayout(layout: Layout): void`
     *
     * ℹ️ The `useGroupRef` and `useGroupCallbackRef` hooks are exported for convenience use in TypeScript projects.
     */
    groupRef?: Ref<GroupImperativeHandle | null> | undefined;
    /**
     * Uniquely identifies this group within an application.
     * Falls back to `useId` when not provided.
     *
     * ℹ️ This value will also be assigned to the `id` and `data-testid` attributes.
     */
    id?: string | number | undefined;
    /**
     * Called when the Group's layout is changing.
     *
     * ⚠️ For layout changes caused by pointer events, this method is called each time the pointer is moved.
     * For most cases, it is recommended to use the `onLayoutChanged` callback instead.
     */
    onLayoutChange?: (layout: Layout) => void | undefined;
    /**
     * Called after the Group's layout has  been changed.
     *
     * ℹ️ For layout changes caused by pointer events, this method is not called until the pointer has been released.
     * This method is recommended when saving layouts to some storage api.
     *
     * ℹ️ The second argument contains meta information about the layout change.
     * The `isUserInteraction` attribute signals whether the resize was caused by direct user input.
     * It is true for resizes caused by pointer or keyboard input
     * and false for other triggers (e.g. imperative API calls, initial mount, etc.)
     * The `requestedLayout` attribute is the layout before constraints were applied for the current Group size;
     * prefer it when persisting layouts.
     */
    onLayoutChanged?: (layout: Layout, meta: LayoutChangedMeta) => void;
    /**
     * Controls whether pointer dragging updates `Panel`s sizes immediately,
     * or renders overlay separator previews until the pointer is released.
     *
     * Defaults to `"panel"` (immediate resizing); `"separator"` defers resizing until release.
     *
     * Customize previews using the `SeparatorOverlay` component.
     */
    resizePreviewMode?: ResizePreviewMode | undefined;
    /**
     * Minimum size of the resizable hit target area (either `Separator` or `Panel` edge)
     * This threshold ensures are large enough to avoid mis-clicks.
     *
     * - Coarse inputs (typically a finger on a touchscreen) have reduced accuracy;
     * to ensure accessibility and ease of use, hit targets should be larger to prevent mis-clicks.
     * - Fine inputs (typically a mouse) can be smaller
     *
     * ℹ️ [Apple interface guidelines](https://developer.apple.com/design/human-interface-guidelines/accessibility) suggest `20pt` (`27px`) on desktops and `28pt` (`37px`) for touch devices
     * In practice this seems to be much larger than many of their own applications use though.
     */
    resizeTargetMinimumSize?: {
        coarse: number;
        fine: number;
    };
    /**
     * Specifies the resizable orientation ("horizontal" or "vertical"); defaults to "horizontal"
     */
    orientation?: "horizontal" | "vertical" | undefined;
    /**
     * CSS properties.
     *
     * ⚠️ The default inline styles cannot be overridden, except for [`overflow`](https://react-resizable-panels.vercel.app/examples/overflow).
     */
    style?: CSSProperties | undefined;
};

/**
 * Caches and returns matchMedia()'s computed value for "pointer:coarse"
 */
export declare function isCoarsePointer(): boolean;

/**
 * Map of item (e.g. Panel) id to size (a percentage between 0..100)
 */
export declare type Layout = {
    [id: string]: number;
};

/**
 * Metadata describing a completed layout change, passed as the second argument to the `onLayoutChanged` callback.
 * See #716.
 */
export declare type LayoutChangedMeta<RequestedLayout = Layout> = {
    /**
     * `true` when the change was caused by the user directly manipulating a separator (keyboard or pointer)
     * `false` for every other source (imperative API calls, constraint recompute, default-size change, initial mount),
     * because the library cannot attribute the caller's intent there.
     */
    isUserInteraction: boolean;
    /**
     * Layout most recently requested by the user or application (e.g. pointer or keyboard input, imperative API, default layout)
     * before constraints were applied for the current size.
     *
     * This will differ from the validated layout when constraints temporarily override the requested layout,
     * e.g. a panel with a pixel-based `minSize` taking up a larger percentage of a small Group.
     * The requested layout is restored if the Group grows back to a size where it satisfies all constraints.
     *
     * ℹ️ When saving layouts to storage, prefer this value to the validated layout.
     */
    requestedLayout?: RequestedLayout | undefined;
};

export declare type LayoutStorage = Pick<Storage, "getItem" | "setItem">;

export declare type OnGroupLayoutChange = GroupProps["onLayoutChange"];

export declare type OnPanelResize = PanelProps["onResize"];

/**
 * Types shared by the resize machinery (layout math, pointer and keyboard interactions, cursors, etc.)
 * which is used by both the Group and Grid components.
 *
 * - A "resize axis" is a set of items that can be resized along one orientation;
 *   e.g. a Group (whose items are Panels) or one axis of a Grid (whose items are columns or rows).
 * - A "resize item" is one of those items (e.g. a Panel or a Grid track).
 * - A separator (e.g. a Separator or a Gridline) resizes the items on either side of it.
 */
/**
 * Orientation loosely relates to the `aria-orientation` attribute.
 * It determines how items are laid out and the direction they can be resized in.
 */
export declare type Orientation = "horizontal" | "vertical";

/**
 * A Panel wraps resizable content and can be configured with min/max size constraints and collapsible behavior.
 *
 * Panel size props can be in the following formats:
 * - Percentage of the parent Group (0..100)
 * - Pixels
 * - Relative font units (em, rem)
 * - Viewport relative units (vh, vw)
 *
 * ℹ️ Numeric values are assumed to be pixels.
 * Strings without explicit units are assumed to be percentages (0%..100%).
 * Percentages may also be specified as strings ending with "%" (e.g. "33%")
 * Pixels may also be specified as strings ending with the unit "px".
 * Other units should be specified as strings ending with their CSS property units (e.g. 1rem, 50vh)
 *
 * Panel elements always include the following attributes:
 *
 * ```html
 * <div data-panel data-testid="panel-id-prop" id="panel-id-prop">
 * ```
 *
 * ℹ️ [Test id](https://testing-library.com/docs/queries/bytestid/) can be used to narrow selection when unit testing.
 *
 * ⚠️ Panel elements must be direct DOM children of their parent Group elements.
 */
export declare function Panel({ children, className, collapsedSize, collapsedThreshold, collapsible, defaultSize, disabled, elementRef: elementRefProp, groupResizeBehavior, id: idProp, maxSize, minSize, onResize: onResizeUnstable, panelRef, style, ...rest }: PanelProps): JSX.Element;

export declare namespace Panel {
    var displayName: string;
}

/**
 * Size constraints may be specified in a variety of ways:
 * - Percentage of the parent Group (0..100)
 * - Pixels
 * - Relative font units (em, rem)
 * - Viewport relative units (vh, vw)
 *
 * Numeric values are assumed to be pixels.
 * Strings without explicit units are assumed to be percentages (0%..100%).
 *
 * Percentages may also be specified as strings ending with "%" (e.g. "33%")
 * Pixels may also be specified as strings ending with the unit "px".
 *
 * Other units should be specified as strings ending with their CSS property units (e.g. 1rem, 50vh)
 */
declare type PanelConstraintProps = Pick<PanelProps, "collapsedSize" | "collapsedThreshold" | "collapsible" | "defaultSize" | "disabled" | "groupResizeBehavior" | "maxSize" | "minSize">;

/**
 * Imperative Panel API
 *
 * ℹ️ The `usePanelRef` and `usePanelCallbackRef` hooks are exported for convenience use in TypeScript projects.
 */
export declare interface PanelImperativeHandle {
    /**
     * Collapse the Panel to it's `collapsedSize`.
     *
     * ⚠️ This method will do nothing if the Panel is not `collapsible` or if it is already collapsed.
     */
    collapse: () => void;
    /**
     * Expand a collapsed Panel to its most recent size.
     *
     * ⚠️ This method will do nothing if the Panel is not currently collapsed.
     */
    expand: () => void;
    /**
     * Get the current size of the Panel in pixels as well as a percentage of the parent group (0..100).
     *
     * @return Panel size (in pixels and as a percentage of the parent group)
     */
    getSize: () => {
        asPercentage: number;
        inPixels: number;
    };
    /**
     * The Panel is currently collapsed.
     */
    isCollapsed: () => boolean;
    /**
     * Update the Panel's size.
     *
     * Size can be in the following formats:
     * - Percentage of the parent Group (0..100)
     * - Pixels
     * - Relative font units (em, rem)
     * - Viewport relative units (vh, vw)
     *
     * ℹ️ Numeric values are assumed to be pixels.
     * Strings without explicit units are assumed to be percentages (0%..100%).
     * Percentages may also be specified as strings ending with "%" (e.g. "33%")
     * Pixels may also be specified as strings ending with the unit "px".
     * Other units should be specified as strings ending with their CSS property units (e.g. 1rem, 50vh)
     *
     * @param size New panel size
     * @return Applied size (after validation)
     */
    resize: (size: number | string) => void;
}

export declare type PanelProps = BasePanelAttributes & {
    /**
     * CSS class name.
     *
     * ⚠️ Class is applied to nested `HTMLDivElement` to avoid styles that interfere with Flex layout.
     */
    className?: string | undefined;
    /**
     * Panel size when collapsed; defaults to 0%.
     */
    collapsedSize?: number | string | undefined;
    /**
     * Distance a collapsible panel must be resized past its `minSize` to collapse,
     * or past its `collapsedSize` to expand.
     * Defaults to half the distance between `collapsedSize` and `minSize`.
     *
     * For example if a panel declares `collapsedSize="5%"`, `collapsedThreshold="5%"`, and `minSize="25%"`,
     * it will collapse when resized below 20% and expands when resized above 10%.
     *
     * ℹ️ Interpretation rules:
     * - Numbers are interpreted as pixels (e.g. `minSize={200}` is 200 pixels)
     * - Strings without explicit units are interpreted as percentage (e.g. `minSize="50"` is 50 percent)
     * - Use explicit units (e.g. "px", "%", "em", "rem", "vh", or "vw") to change interpretation
     */
    collapsedThreshold?: number | string | undefined;
    /**
     * This panel can be collapsed.
     *
     * ℹ️ A collapsible panel will collapse when it's size is less than of the specified `minSize`
     */
    collapsible?: boolean | undefined;
    /**
     * Default size of Panel within its parent group; default is auto-assigned based on the total number of Panels.
     *
     * ℹ️ Interpretation rules:
     * - Numbers are interpreted as pixels (e.g. `defaultSize={200}` is 200 pixels)
     * - Strings without explicit units are interpreted as percentage (e.g. `defaultSize="50"` is 50 percent)
     * - Use explicit units (e.g. "px", "%", "em", "rem", "vh", or "vw") to change interpretation
     *
     * ⚠️ Percentage based sizes may cause slight layout shift when server-rendering.
     * For more information see the documentation.
     */
    defaultSize?: number | string | undefined;
    /**
     * When disabled, a panel cannot be resized either directly or indirectly (by resizing another panel).
     */
    disabled?: boolean | undefined;
    /**
     * Ref attached to the root `HTMLDivElement`.
     */
    elementRef?: Ref<HTMLDivElement | null> | undefined;
    /**
     * How should this Panel behave if the parent Group is resized?
     * Defaults to `preserve-relative-size`.
     *
     * - `preserve-relative-size`: Retain the current relative size (as a percentage of the Group)
     * - `preserve-pixel-size`: Retain its current size (in pixels)
     *
     * ℹ️ Panel min/max size constraints may impact this behavior.
     *
     * ⚠️ A Group must contain at least one Panel with `preserve-relative-size` resize behavior.
     */
    groupResizeBehavior?: "preserve-relative-size" | "preserve-pixel-size" | undefined;
    /**
     * Uniquely identifies this panel within the parent group.
     * Falls back to `useId` when not provided.
     *
     * ℹ️ This prop is used to associate persisted group layouts with the original panel.
     *
     * ℹ️ This value will also be assigned to the `id` and `data-testid` attributes.
     */
    id?: string | number | undefined;
    /**
     * Maximum size of Panel within its parent group; defaults to `"100%"`.
     *
     * ℹ️ Interpretation rules:
     * - Numbers are interpreted as pixels (e.g. `maxSize={200}` is 200 pixels)
     * - Strings without explicit units are interpreted as percentage (e.g. `maxSize="50"` is 50 percent)
     * - Use explicit units (e.g. "px", "%", "em", "rem", "vh", or "vw") to change interpretation
     */
    maxSize?: number | string | undefined;
    /**
     * Minimum size of Panel within its parent group; defaults to 0%.
     *
     * ℹ️ Interpretation rules:
     * - Numbers are interpreted as pixels (e.g. `minSize={200}` is 200 pixels)
     * - Strings without explicit units are interpreted as percentage (e.g. `minSize="50"` is 50 percent)
     * - Use explicit units (e.g. "px", "%", "em", "rem", "vh", or "vw") to change interpretation
     */
    minSize?: number | string | undefined;
    /**
     * Called when panel sizes change.
     *
     * @param panelSize Panel size (both as a percentage of the parent Group and in pixels)
     * @param id Panel id (if one was provided as a prop)
     * @param prevPanelSize Previous panel size (will be undefined on mount)
     */
    onResize?: ((panelSize: PanelSize, id: string | number | undefined, prevPanelSize: PanelSize | undefined) => void) | undefined;
    /**
     * Exposes the following imperative API:
     * - `collapse(): void`
     * - `expand(): void`
     * - `getSize(): number`
     * - `isCollapsed(): boolean`
     * - `resize(size: number): void`
     *
     * ℹ️ The `usePanelRef` and `usePanelCallbackRef` hooks are exported for convenience use in TypeScript projects.
     */
    panelRef?: Ref<PanelImperativeHandle | null> | undefined;
    /**
     * CSS properties.
     *
     * ⚠️ The default inline styles cannot be overridden, except for [`overflow`](https://react-resizable-panels.vercel.app/examples/overflow).
     */
    style?: CSSProperties | undefined;
};

export declare type PanelSize = {
    asPercentage: number;
    inPixels: number;
};

declare type ResizePreviewMode = "panel" | "separator";

/**
 * Separators are not _required_ but they are _recommended_ as they improve keyboard accessibility.
 *
 * ⚠️ Separator elements must be direct DOM children of their parent Group elements.
 *
 * Separator elements always include the following attributes:
 *
 * ```html
 * <div data-separator data-testid="separator-id-prop" id="separator-id-prop" role="separator">
 * ```
 *
 * ℹ️ [Test id](https://testing-library.com/docs/queries/bytestid/) can be used to narrow selection when unit testing.
 *
 * ℹ️ In addition to the attributes shown above, separator also renders all required [WAI-ARIA properties](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/separator_role#associated_wai-aria_roles_states_and_properties).
 */
export declare function Separator({ children, className, disabled, disableDoubleClick, elementRef, id: idProp, preview, style, ...rest }: SeparatorProps): JSX.Element;

export declare namespace Separator {
    var displayName: string;
}

/**
 * Customizes separator previews when resizePreviewMode is "separator".
 * Render within a `Group` to style all overlay previews, or pass to an individual `Separator` to style its overlay preview.
 *
 * Use `data-separator-overlay="active"` to style the separator being dragged,
 * or `data-separator-overlay="inactive"` for separators moved indirectly.
 *
 * Set `width` (horizontal groups) or `height` (vertical groups) using `style` or `className`.
 */
export declare function SeparatorOverlay(props: SeparatorOverlayProps): null;

export declare namespace SeparatorOverlay {
    var displayName: string;
}

export declare type SeparatorOverlayProps = HTMLAttributes<HTMLDivElement>;

export declare type SeparatorProps = BaseSeparatorAttributes & {
    /**
     * CSS class name.
     *
     * ℹ️ Use the `data-separator` attribute for custom _hover_ and _active_ styles
     *
     * ⚠️ The following properties cannot be overridden: `flex-grow`, `flex-shrink`
     */
    className?: string | undefined;
    /**
     * When disabled, the separator cannot be used to resize its neighboring panels.
     *
     * ℹ️ The panels may still be resized indirectly (while other panels are being resized).
     * To prevent a panel from being resized at all, it needs to also be disabled.
     */
    disabled?: boolean | undefined;
    /**
     * When true, double-clicking this `Separator` will not reset its `Panel` to its default size.
     */
    disableDoubleClick?: boolean;
    /**
     * Ref attached to the root `HTMLDivElement`.
     */
    elementRef?: Ref<HTMLDivElement> | undefined;
    /**
     * Uniquely identifies the separator within the parent group.
     * Falls back to `useId` when not provided.
     *
     * ℹ️ This value will also be assigned to the `id` and `data-testid` attributes.
     */
    id?: string | number | undefined;
    /**
     * Overrides the `Group` default preview for this `Separator` when `resizePreviewMode` is "separator".
     */
    preview?: ReactNode;
    /**
     * CSS properties.
     *
     * ℹ️ Use the `data-separator` attribute for custom _hover_ and _active_ styles
     *
     * ⚠️ The following properties cannot be overridden: `flex-grow`, `flex-shrink`
     */
    style?: CSSProperties | undefined;
};

export declare type SizeUnit = "px" | "%" | "em" | "rem" | "vh" | "vw";

/**
 * Saves and restores Grid layouts between page loads.
 * It can be configured to store values using `localStorage`, `sessionStorage`, cookies, or any other persistence layer that makes sense for your application.
 */
export declare function useDefaultGridLayout({ id, onlySaveAfterUserInteractions, storage }: {
    /**
     * Uniquely identifies a specific grid/layout.
     */
    id: string;
    /**
     * Only auto-save layouts that were directly caused by user input (e.g. keyboard or mouse events).
     * Ignore layout changes resulting from imperative API calls or window resize events.
     */
    onlySaveAfterUserInteractions?: boolean;
    /**
     * Storage implementation; supports localStorage, sessionStorage, and custom implementations
     * Refer to documentation site for example integrations.
     */
    storage?: LayoutStorage;
}): {
    /**
     * Pass this value to `Grid` as the `defaultLayout` prop.
     */
    defaultLayout: Partial<GridLayout> | undefined;
    /**
     * Attach this callback on the `Grid` as the `onLayoutChanged` prop.
     */
    onLayoutChanged: (layout: GridLayout, meta: LayoutChangedMeta<GridLayout>) => void;
};

/**
 * Saves and restores group layouts between page loads.
 * It can be configured to store values using `localStorage`, `sessionStorage`, cookies, or any other persistence layer that makes sense for your application.
 */
export declare function useDefaultLayout({ debounceSaveMs, onlySaveAfterUserInteractions, panelIds, storage, ...rest }: {
    /**
     * Debounce save operation by the specified number of milliseconds; defaults to 100ms
     *
     * @deprecated Use the {@link onLayoutChanged} callback instead; it does not require debouncing
     */
    debounceSaveMs?: number;
    /**
     * Only auto-save layouts that were directly caused by user input (e.g. keyboard or mouse events).
     * Ignore layout changes resulting from imperative API calls or window resize events.
     */
    onlySaveAfterUserInteractions?: boolean;
    /**
     * For Groups that contain conditionally-rendered Panels, this prop can be used to save and restore multiple layouts.
     *
     * ℹ️ This prevents layout shift for server-rendered apps.
     *
     * ⚠️ Panel ids must match the Panels rendered within the Group during mount or the initial layout will be incorrect.
     */
    panelIds?: string[] | undefined;
    /**
     * Storage implementation; supports localStorage, sessionStorage, and custom implementations
     * Refer to documentation site for example integrations.
     *
     */
    storage?: LayoutStorage;
} & ({
    /**
     * Group id; must be unique in order for layouts to be saved separately.
     * @deprecated Use the {@link id} param instead
     */
    groupId: string;
} | {
    /**
     * Uniquely identifies a specific group/layout.
     */
    id: string;
})): {
    /**
     * Pass this value to `Group` as the `defaultLayout` prop.
     */
    defaultLayout: Layout | undefined;
    /**
     * Attach this callback on the `Group` as the `onLayoutChange` prop.
     *
     * @deprecated Use the {@link onLayoutChanged} prop instead.
     */
    onLayoutChange: (layout: Layout) => void | undefined;
    /**
     * Attach this callback on the `Group` as the `onLayoutChanged` prop.
     */
    onLayoutChanged: (layout: Layout, meta: LayoutChangedMeta) => void;
};

/**
 * Convenience hook to return a properly typed ref callback for the Grid component.
 *
 * Use this hook when you need to share the ref with another component or hook.
 */
export declare function useGridCallbackRef(): [GridImperativeHandle | null, Dispatch<SetStateAction<GridImperativeHandle | null>>];

/**
 * Convenience hook to return a properly typed ref for the Grid component.
 */
export declare function useGridRef(): RefObject<GridImperativeHandle | null>;

/**
 * Convenience hook to return a properly typed ref callback for the Group component.
 *
 * Use this hook when you need to share the ref with another component or hook.
 */
export declare function useGroupCallbackRef(): [GroupImperativeHandle | null, Dispatch<SetStateAction<GroupImperativeHandle | null>>];

/**
 * Convenience hook to return a properly typed ref for the Group component.
 */
export declare function useGroupRef(): RefObject<GroupImperativeHandle | null>;

/**
 * Convenience hook to return a properly typed ref callback for the Panel component.
 *
 * Use this hook when you need to share the ref with another component or hook.
 */
export declare function usePanelCallbackRef(): [PanelImperativeHandle | null, Dispatch<SetStateAction<PanelImperativeHandle | null>>];

/**
 * Convenience hook to return a properly typed ref for the Panel component.
 */
export declare function usePanelRef(): RefObject<PanelImperativeHandle | null>;

export { }
