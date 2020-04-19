// ENUMS

enum NoteThemeName {
  Yellow = 'yellow',
  Pink = 'pink',
  Blue = 'blue',
  Beige = 'beige',
  Green = 'green',
  Turquoise = 'turquoise',
  Purple = 'purple',
  Orange = 'orange',
}

// INTERFACES

interface NotePosition {
  top: number;
  left: number;
}

interface NoteScale {
  width: number;
  height: number;
}

interface NoteState {
  id: string;
  position: NotePosition;
  scale: NoteScale;
  theme: NoteThemeName;
  title: string;
  content: string;
}

type Note = NoteState;

// COMMON CONSTANTS

const CLASSNAME = {
  MODAL_THEME_SELECTED: 'modal-theme-selected',
};

const NON_DIGIT_REGEXP = /\D/g;

const LOCAL_STORAGE_ITEM_NAME = 'sticky-notes';

const FADE_DURATION = 300;

const MIN_NOTE_SIDE = 100; // in pixels

const MODAL_TITLE = {
  CREATE: 'New note',
  EDIT: 'Edit note',
};

const KEY_CODE_ENTER = 13;

// JQUERY CONSTANTS

const titleInput: JQuery<HTMLInputElement> = $('#note-title');
const contentInput: JQuery<HTMLInputElement> = $('#note-content');
const themesElements: JQuery<HTMLDivElement> = $('#note-themes > div');
const widthInput: JQuery<HTMLInputElement> = $('#width');
const heightInput: JQuery<HTMLInputElement> = $('#height');
const saveNoteButton: JQuery<HTMLButtonElement> = $('#save-note');
const newNoteButton: JQuery<HTMLButtonElement> = $('#open-note-modal');
const backdrop: JQuery<HTMLDivElement> = $('#backdrop');
const noteModal: JQuery<HTMLDivElement> = $('#note-modal');
const modalCloseIconButton: JQuery<HTMLButtonElement> = $('#close-icon');
const modalCloseButton: JQuery<HTMLButtonElement> = $('#close-button');
const noteContainer: JQuery<HTMLDivElement> = $('#note-container');
const invalidWidth: JQuery<HTMLDivElement> = $('#invalid-width');
const invalidHeight: JQuery<HTMLDivElement> = $('#invalid-height');
const defaultTheme: JQuery<HTMLDivElement> = $(
  `#note-themes > div[data-name=${NoteThemeName.Blue}]`,
);
const header: JQuery<HTMLElement> = $('#header');
const modalTitle: JQuery<HTMLTitleElement> = $('#modal-title');

// HELPERS

const getLocalStorageItem = (key: string): string => localStorage.getItem(key);

const setLocalStorageItem = (key: string, value: string): void =>
  localStorage.setItem(key, value);

// https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript/43901924#43901924
const generateUUIDv4 = (): string =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;

    return v.toString(16);
  });

const getNotesFromLocalStorage = (): Note[] =>
  JSON.parse(getLocalStorageItem(LOCAL_STORAGE_ITEM_NAME)) || [];

const setNotesToLocalStorage = (notes: Note[]): void =>
  setLocalStorageItem(LOCAL_STORAGE_ITEM_NAME, JSON.stringify(notes));

const getRandomPosition = (max: number): number => _.sample(_.range(10, max));

const getIsContainsInRange = (
  start: number,
  stop: number,
  value: number,
): boolean => _.contains(_.range(start, stop), value);

// HANDLERS

const openNoteModal = (): void => {
  backdrop.fadeTo(FADE_DURATION, 1);
  noteModal.fadeTo(FADE_DURATION, 1);
};

const closeNoteModal = (): void => {
  isNoteEditing = false;

  setNoteState(defaultNoteState);

  clearNoteModalFields();

  backdrop.fadeTo(FADE_DURATION, 0).hide();
  noteModal.fadeTo(FADE_DURATION, 0).hide();
};

const handleNoteDelete = (id: string): void => {
  const filteredNotes = _.reject<Note>(notesState, _.matcher({ id: id }));

  setNotesState(filteredNotes);

  const noteToRemove = $(`#${id}`);

  noteToRemove.remove();
};

const handleNoteEdit = (id: string): void => {
  isNoteEditing = true;

  const foundNote = _.find<Note>(notesState, _.matcher({ id: id }));

  setNoteState(foundNote);

  const {
    title,
    content,
    theme,
    scale: { width, height },
  } = foundNote;

  modalTitle.text(MODAL_TITLE.EDIT);

  titleInput.val(title);

  contentInput.val(content);

  const themeElement = $(`#note-themes > div[data-name=${theme}]`);

  themesElements.removeClass(CLASSNAME.MODAL_THEME_SELECTED);

  themeElement.addClass(CLASSNAME.MODAL_THEME_SELECTED);

  widthInput.val(width);

  heightInput.val(height);

  openNoteModal();
};

const handleNoteModalFieldChange = (
  event: JQuery.ChangeEvent<
    HTMLInputElement,
    undefined,
    HTMLInputElement,
    HTMLInputElement
  >,
): void => {
  const {
    target: { name, value },
    target,
  } = event;
  const isWidthChanged = name === 'width';
  const isHeightChanged = name === 'height';

  const isNoteSizeChanged = isWidthChanged || isHeightChanged;

  const isNoteSizeInvalid = isNoteSizeChanged && Number(value) < MIN_NOTE_SIDE;

  setNoteState({
    ...noteState,
    ...(isNoteSizeChanged
      ? { scale: { ...noteState.scale, [name]: Number(value) } }
      : { [name]: value }),
  });

  const invalidElement = isWidthChanged ? invalidWidth : invalidHeight;

  isNoteSizeInvalid ? invalidElement.show() : invalidElement.hide();

  if (_.isEmpty(value) || isNoteSizeInvalid) {
    target.classList.add('validate');
  } else {
    target.classList.remove('validate');
  }
};

const handleNoteContainerMouseUp = (
  { id, offsetTop, offsetLeft, clientWidth, clientHeight }: HTMLDivElement,
  target: HTMLElement,
): void => {
  const isEditIcon = target.dataset.editid;
  const isDeleteIcon = target.dataset.deleteid;

  if (isEditIcon) {
    handleNoteEdit(id);
  }

  if (isDeleteIcon) {
    handleNoteDelete(id);
  }

  // Stop moving when mouse button is released:
  noteContainer.off('mouseup mousemove');

  const updatedNotes = _.map(notesState, (note) => {
    if (note.id === id) {
      return {
        ...note,
        position: {
          top: offsetTop,
          left: offsetLeft,
        },
        scale: {
          width: clientWidth,
          height: clientHeight,
        },
      };
    }

    return note;
  });

  setNotesState(updatedNotes);
};

const handleNoteContainerMouseMove = ({
  event,
  noteElement,
  isLeftSideHover,
  isRightSideHover,
  isTopSideHover,
  isBottomSideHover,
}: {
  event: JQuery.MouseMoveEvent;
  noteElement: HTMLDivElement;
  isLeftSideHover?: boolean;
  isRightSideHover?: boolean;
  isTopSideHover?: boolean;
  isBottomSideHover?: boolean;
}): void => {
  event.preventDefault();

  const {
    clientX: currentPositionByX,
    clientY: currentPositionByY,
    pageY,
  } = event;

  const headerHeight = header.innerHeight();

  newPositionByX = startPositionByX - currentPositionByX;
  newPositionByY = startPositionByY - currentPositionByY;
  startPositionByX = currentPositionByX;
  startPositionByY = currentPositionByY;

  if (isLeftSideHover) {
    noteElement.style.left = `${currentPositionByX}px`;
    noteElement.style.width = `${noteElement.clientWidth + newPositionByX}px`;
  } else if (isRightSideHover) {
    noteElement.style.width = `${noteElement.clientWidth - newPositionByX}px`;
  } else if (isTopSideHover) {
    noteElement.style.top = `${pageY - headerHeight}px`;
    noteElement.style.height = `${noteElement.clientHeight + newPositionByY}px`;
  } else if (isBottomSideHover) {
    noteElement.style.height = `${noteElement.clientHeight - newPositionByY}px`;
  } else {
    noteElement.style.top = `${noteElement.offsetTop - newPositionByY}px`;
    noteElement.style.left = `${noteElement.offsetLeft - newPositionByX}px`;
  }
};

const handleNoteMouseDown = ({
  event,
  isLeftSideHover,
  isRightSideHover,
  isTopSideHover,
  isBottomSideHover,
}: {
  event: MouseEvent;
  isLeftSideHover?: boolean;
  isRightSideHover?: boolean;
  isTopSideHover?: boolean;
  isBottomSideHover?: boolean;
}): void => {
  event.preventDefault();

  const { clientX, clientY, currentTarget } = event;

  startPositionByX = clientX;
  startPositionByY = clientY;

  const noteElement = currentTarget as HTMLDivElement;

  const { id } = noteElement;

  const lastRenderedNote = noteContainer.children().last();

  const jqueryNoteElement = $(`#${id}`);

  jqueryNoteElement.insertAfter(lastRenderedNote);

  const currentNote = _.find<Note>(notesState, _.matcher({ id }));

  // Move current note to end
  setNotesState([..._.without<Note>(notesState, currentNote), currentNote]);

  noteContainer.on('mouseup', ({ target }) =>
    handleNoteContainerMouseUp(noteElement, target),
  );
  noteContainer.on('mousemove', (event) =>
    handleNoteContainerMouseMove({
      event,
      noteElement,
      isLeftSideHover,
      isRightSideHover,
      isTopSideHover,
      isBottomSideHover,
    }),
  );
};

const handleNoteMouseMove = ({
  pageX,
  pageY,
  currentTarget: noteElement,
}: JQuery.MouseMoveEvent<
  HTMLDivElement,
  undefined,
  HTMLDivElement,
  HTMLDivElement
>): void => {
  const { clientWidth: noteWidth, clientHeight: noteHeight } = noteElement;

  const headerHeight = header.innerHeight();

  const positionInNoteByX = pageX - noteElement.offsetLeft;
  const positionInNoteByY = pageY - noteElement.offsetTop - headerHeight;

  const isLeftSideHover = getIsContainsInRange(-1, 5, positionInNoteByX);
  const isRightSideHover = getIsContainsInRange(
    -5,
    1,
    positionInNoteByX - noteWidth,
  );
  const isTopSideHover = getIsContainsInRange(-1, 5, positionInNoteByY);
  const isBottomSideHover = getIsContainsInRange(
    -5,
    0,
    positionInNoteByY - noteHeight,
  );

  noteElement.onmousedown = (event) =>
    handleNoteMouseDown({
      event,
      isLeftSideHover,
      isRightSideHover,
      isTopSideHover,
      isBottomSideHover,
    });

  if (isLeftSideHover) {
    noteElement.style.cursor = 'w-resize';
  } else if (isRightSideHover) {
    noteElement.style.cursor = 'e-resize';
  } else if (isTopSideHover) {
    noteElement.style.cursor = 'n-resize';
  } else if (isBottomSideHover) {
    noteElement.style.cursor = 's-resize';
  } else {
    noteElement.style.cursor = 'move';
  }
};

const clearNoteModalFields = (): void => {
  // Clear input values
  _.forEach(noteFormInputs, (input) => {
    input.val('');
  });

  // set default theme
  themesElements.removeClass(CLASSNAME.MODAL_THEME_SELECTED);
  defaultTheme.addClass(CLASSNAME.MODAL_THEME_SELECTED);

  noteFormInputs.forEach((input) => {
    input.removeClass('validate');
  });

  invalidHeight.hide();
  invalidWidth.hide();
};

const addNoteToContainer = ({
  id,
  title,
  content,
  theme,
  scale: { width, height },
  position: { top, left },
}: Note): void => {
  const noteTemplate = `
        <div
          id="${id}"
          class="note note-theme-${theme}"
          style="
              width: ${width}px;
              height: ${height}px;
              top: ${top}px;
              left: ${left}px;"
          >
          <span>
            <h4>${title}</h4>
            <p>${content}</p>
          </span>
          <span class="note-icons">
            <a class="right">
              <i class="fa fa-trash-o pointer" data-deleteid="${id}" title="Delete note"></i>
            </a>
            <a class="right" style="margin-right: 1vw;">
              <i class="fa fa-pencil pointer" data-editid="${id}" title="Edit note"></i>
            </a>
          </span>
        </div>`;

  noteContainer.append(noteTemplate);

  const currentNote = $(`#${id}`);

  currentNote.on('mousemove', handleNoteMouseMove);
};

const handleNumericInputKeyup = ({
  target: input,
}: JQuery.KeyUpEvent<
  HTMLInputElement,
  undefined,
  HTMLInputElement,
  HTMLInputElement
>): void => {
  const { value } = input;

  if (Number(value) === 0) {
    // Clear if only zeros entered
    input.value = '';
  } else if (NON_DIGIT_REGEXP.test(value)) {
    // Filter non-digits from input value
    input.value = value.replace(NON_DIGIT_REGEXP, '');
  } else {
    // Clear useless zeros: 0012 => 12
    input.value = `${Number(value)}`;
  }
};

const handleNewNoteClick = (): void => {
  modalTitle.text(MODAL_TITLE.CREATE);

  openNoteModal();

  titleInput.trigger('focus');
};

const handleNoteSave = (): void => {
  let isNoteFormValid = true;

  // Validate all inputs
  _.forEach(noteFormInputs, (noteFormInput) => {
    const inputName = noteFormInput.prop('name');

    if (inputName === 'width' || inputName === 'height') {
      if (noteFormInput.val() < MIN_NOTE_SIDE) isNoteFormValid = false;
    }

    if (_.isEmpty(noteFormInput.val())) {
      noteFormInput.addClass('validate');

      isNoteFormValid = false;
    }
  });

  if (!isNoteFormValid) return;

  if (isNoteEditing) {
    const {
      id: editedNoteId,
      title,
      content,
      theme,
      scale: { width, height },
      position: { top, left },
    } = noteState;

    const updatedNotes = _.map(notesState, (note) => {
      if (note.id === editedNoteId) {
        return noteState as Note;
      }

      return note;
    });

    setNotesState(updatedNotes);

    const editedNoteSelector = `#${editedNoteId}`;

    const editedNote = $(editedNoteSelector);

    editedNote.removeAttr('class');

    editedNote.addClass(`note note-theme-${theme}`);

    editedNote.css({
      width: `${width}px`,
      height: `${height}px`,
      top: `${top}px`,
      left: `${left}px`,
    });

    const editedNoteTitle = $(`${editedNoteSelector}>span>h4`);

    editedNoteTitle.text(title);

    const editedNoteContent = $(`${editedNoteSelector}>span>p`);

    editedNoteContent.text(content);
  } else {
    // Creating note
    const {
      scale: { height, width },
    } = noteState;

    const maxTop = Math.abs(noteContainer.innerHeight() - height);
    const maxLeft = Math.abs(noteContainer.innerWidth() - width);

    const note = {
      ...noteState,
      id: generateUUIDv4(),
      position: {
        top: getRandomPosition(maxTop),
        left: getRandomPosition(maxLeft),
      },
    } as Note;

    setNotesState([...notesState, note]);

    addNoteToContainer(note);
  }

  closeNoteModal();
};

const handleThemeClick = ({ target }: MouseEvent): void => {
  const selectedTheme = target as HTMLDivElement;

  setNoteState({
    ...noteState,
    theme: selectedTheme.dataset.name as NoteThemeName,
  });

  themesElements.removeClass(CLASSNAME.MODAL_THEME_SELECTED);
  selectedTheme.classList.add(CLASSNAME.MODAL_THEME_SELECTED);
};

const handlePageUnload = (): void => {
  setNotesToLocalStorage(notesState);
};

const handleNoteModalKeyUp = ({ keyCode, which }: JQuery.KeyUpEvent): void => {
  const code = keyCode || which;
  if (code === KEY_CODE_ENTER) {
    $('#note-modal input').trigger('blur');

    saveNoteButton.trigger('click');
  }
};

const renderNotes = (): void => {
  const notes = getNotesFromLocalStorage();

  if (_.isEmpty(notes)) return;

  _.forEach(notes, (note) => addNoteToContainer(note));
};

// MAIN

const noteFormInputs = [titleInput, contentInput, widthInput, heightInput];

let startPositionByX: number;
let startPositionByY: number;
let newPositionByX: number;
let newPositionByY: number;
let isNoteEditing: boolean = false;

// Blue color is selected in the default state
const defaultNoteState = { theme: NoteThemeName.Blue };

let noteState: Partial<NoteState> = defaultNoteState;

let notesState: Note[] = getNotesFromLocalStorage();

const setNoteState = (state: Partial<NoteState>): void => {
  noteState = state;
};

const setNotesState = (state: Note[]): void => {
  notesState = state;
};

renderNotes();

_.forEach([modalCloseButton, modalCloseIconButton, backdrop], (element) => {
  element.on('click', closeNoteModal);
});

// Validation numeric inputs
_.forEach([widthInput, heightInput], (numericInput) => {
  numericInput.on('keyup', handleNumericInputKeyup);
});

_.forEach(themesElements, (themesElement) => {
  themesElement.onclick = handleThemeClick;
});

_.forEach(noteFormInputs, (input) => {
  input.on('change', handleNoteModalFieldChange);
});

newNoteButton.on('click', handleNewNoteClick);

saveNoteButton.on('click', handleNoteSave);

noteModal.on('keyup', handleNoteModalKeyUp);

window.onunload = handlePageUnload;
