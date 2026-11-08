/**
 * Global modal stack registry to handle native Android hardware/gesture back button.
 */

type ModalCloseHandler = () => void;

const modalStack: ModalCloseHandler[] = [];

/**
 * Registers a modal's close handler.
 * Returns an unregister function to call when the modal unmounts.
 */
export function registerModal(onClose: ModalCloseHandler): () => void {
  modalStack.push(onClose);
  return () => {
    const index = modalStack.lastIndexOf(onClose);
    if (index !== -1) {
      modalStack.splice(index, 1);
    }
  };
}

/**
 * Closes the topmost active modal if one exists.
 * Returns true if a modal was closed, false otherwise.
 */
export function popModal(): boolean {
  if (modalStack.length > 0) {
    const close = modalStack.pop();
    if (close) {
      close();
      return true;
    }
  }

  // Fallback: Check if any DOM dialog/modal is open and simulate Escape key
  const openDialog = document.querySelector('[role="dialog"]');
  if (openDialog) {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    return true;
  }

  return false;
}

export function hasOpenModal(): boolean {
  return modalStack.length > 0 || Boolean(document.querySelector('[role="dialog"]'));
}
