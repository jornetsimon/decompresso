/**
 * Scroll to an element inside its parent
 *
 * Prevents scrolling the whole page like Element.scrollIntoView does
 * @author Jordan Maduro
 * @link https://stackoverflow.com/a/45411081
 */
export function scrollParentToChild(parent: Element, child: Element) {
	// Where is the parent on page
	const parentRect = parent.getBoundingClientRect();
	// What can you see?
	const parentViewableArea = {
		height: parent.clientHeight,
		width: parent.clientWidth,
	};

	// Where is the child
	const childRect = child.getBoundingClientRect();
	// Is the child viewable?
	const isViewable =
		childRect.top >= parentRect.top &&
		childRect.top <= parentRect.top + parentViewableArea.height;

	// if you can't see the child try to scroll parent
	if (!isViewable) {
		// scroll by offset relative to parent
		parent.scrollTop = childRect.top + parent.scrollTop - parentRect.top;
	}
}
