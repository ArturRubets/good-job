/* Grab references to the DOM elements */

const addTodoButton = document.querySelector('.add-todo-button');
const addTodoInput = document.querySelector('.add-todo-input');
const clearItemsButton = document.querySelector('.clear-items-button');
const clearItemsContainer = document.querySelector('.clear-items-container');
const header = document.querySelector('.header');
const todoContainer = document.querySelector('.todo-container');

/* Define constants */

const delayDebounce = 1000;
const nameTodoListKey = 'nameTodoListKey';

/* Define classes */

class LocalStorage {
  static getItem(key) {
    return localStorage.getItem(key);
  }

  static setItem(key, item) {
    localStorage.setItem(key, item);
  }

  static removeItem(key) {
    localStorage.removeItem(key);
  }
}

class TodoStorage {
  static todoItemKey = 'todoItemKey';

  static get() {
    const items = JSON.parse(LocalStorage.getItem(this.todoItemKey));
    if (!items) {
      return [];
    }
    return items.sort((a, b) => a.id - b.id);
  }

  static set(todo) {
    LocalStorage.setItem(
      this.todoItemKey,
      JSON.stringify([...this.get(), todo])
    );
  }

  static replaceContent(todo, description) {
    const all = this.get();
    const founded = all.find((t) => t.id === todo.id);
    founded.description = description;
    this.replaceAll(all);
  }

  static replaceAll(todos) {
    LocalStorage.setItem(this.todoItemKey, JSON.stringify(todos));
  }

  static remove(todoId) {
    const all = this.get();
    const filtered = all.filter((todo) => todo.id != todoId);
    if (filtered.length != all.length) {
      this.replaceAll(filtered);
    }
  }

  static clear() {
    LocalStorage.removeItem(this.todoItemKey);
  }
}

class Todo {
  constructor(description) {
    this.description = description;
    this.id = new Date().getTime();
  }
}

/* Define functions */

const debounce =
  (callback, delay, timeout = 0) =>
  (e) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => callback(e), delay);
  };

const inputNameTodoList = () => {
  const nameTodoList = header.value.trim();
  if (nameTodoList) {
    LocalStorage.setItem(nameTodoListKey, nameTodoList);
  }
};

const handleButtonAddTodo = () => {
  addTodoInput.focus();
  if (addTodoInput.value.trim()) {
    const todo = new Todo(addTodoInput.value);

    displayTodo(todo);

    TodoStorage.set(todo);

    addTodoInput.value = '';
    addTodoInput.style.height = 'auto';

    checkDisplayClearItemsButton();
  }
};

const displayTodo = (todo) => todoContainer.append(createTodoElement(todo));

const createTodoElement = (todo) => {
  const divTodo = document.createElement('div');
  divTodo.classList.add('todo');

  const textarea = (() => {
    const textarea = document.createElement('textarea');
    textarea.classList.add('textarea-todo');
    textarea.value = todo.description;
    textarea.setAttribute('readonly', true);
    textarea.setAttribute('rows', 1);
    return textarea;
  })();

  const createIcon = (url) => {
    const icon = document.createElement('i');
    icon.classList.add('icon');
    icon.style.background = `no-repeat center/contain url(${url})`;
    return icon;
  };
  const editIcon = createIcon('images/edit_icon.svg');
  const saveIcon = createIcon('images/save_icon.svg');
  const removeIcon = createIcon('images/remove_icon.svg');

  const icons = (() => {
    const divIcons = document.createElement('div');
    divIcons.classList.add('icons');
    divIcons.append(editIcon);
    divIcons.append(removeIcon);
    return divIcons;
  })();

  saveIcon.addEventListener('click', () => {
    textarea.setAttribute('readonly', true);
    saveIcon.replaceWith(editIcon);
    if (textarea.value) {
      TodoStorage.replaceContent(todo, textarea.value);
    } else {
      divTodo.remove();
      checkDisplayClearItemsButton();
      TodoStorage.remove(todo.id);
    }
  });

  editIcon.addEventListener('click', () => {
    textarea.removeAttribute('readonly');
    textarea.focus();
    editIcon.replaceWith(saveIcon);
  });

  removeIcon.addEventListener('click', () => {
    if (confirmRemove()) {
      divTodo.remove();
      checkDisplayClearItemsButton();
      TodoStorage.remove(todo.id);
    }
  });

  divTodo.append(textarea);
  divTodo.append(icons);
  return divTodo;
};

const listenTypingTodo = () => {
  if (addTodoInput.value) {
    addTodoButton.textContent = 'Save';
  } else {
    addTodoButton.textContent = 'Add';
  }
};

const confirmRemove = () => confirm('Remove?');

const removeAllTodo = () => {
  if (confirmRemove()) {
    todoContainer.innerHTML = '';
    checkDisplayClearItemsButton();
    TodoStorage.clear();
  }
};

const checkDisplayClearItemsButton = () => {
  if (todoContainer.innerHTML === '') {
    clearItemsContainer.style.display = 'none';
  } else {
    clearItemsContainer.style.display = 'block';
  }
};

/* Program implementation */

header.addEventListener('input', debounce(inputNameTodoList, delayDebounce));

addTodoButton.addEventListener('click', handleButtonAddTodo);

addTodoInput.addEventListener('input', listenTypingTodo);

clearItemsButton.addEventListener('click', removeAllTodo);

TodoStorage.get().forEach(displayTodo);

header.value = LocalStorage.getItem(nameTodoListKey);

checkDisplayClearItemsButton();
