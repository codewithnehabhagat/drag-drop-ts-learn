enum TaskStatus {
  Assigned = "Assigned",
  InProgress = "InProgress",
  Done = "Done",
}

interface TaskInput {
  title: string;
  description: string;
}
interface Task {
  taskId: string;
  title: string;
  description: string;
  status: TaskStatus;
}

class State<T> {
  private stateVariable: T;
  private stateChangeListeners: ((val: T) => void)[] = [];

  constructor(
    defaultValue: T,
    stateChangeListeners: ((val: T) => void)[] = []
  ) {
    this.stateVariable = defaultValue;
    this.stateChangeListeners = stateChangeListeners;
    this.setState(this.stateVariable);
  }

  setState(updatedState: T) {
    this.stateVariable = updatedState;
    for (const listenerFn of this.stateChangeListeners) {
      listenerFn(updatedState);
    }
  }

  getState(): T {
    return this.stateVariable;
  }
}

abstract class Component<T, U extends HTMLElement, V extends HTMLElement> {
  templateElement: HTMLTemplateElement;
  hostElement: U;
  element: V;

  constructor(
    templateId: string,
    hostEleId: string,
    insertBefore: Boolean,
    newElementId?: string
  ) {
    this.templateElement = document.getElementById(
      templateId
    )! as HTMLTemplateElement;

    this.hostElement = document.getElementById(hostEleId) as U;

    const node = document.importNode(this.templateElement.content, true);
    this.element = node.firstElementChild as V;
    if (newElementId) {
      this.element.id = newElementId;
    }
    this.hostElement.insertAdjacentElement(
      insertBefore ? "afterbegin" : "beforeend",
      this.element
    );
  }

  abstract render(item: T): void;
}

class TaskItem extends Component<Task, HTMLElement, HTMLDivElement> {
  taskNameEle: HTMLHeadElement;
  taskDescriptionEle: HTMLParagraphElement;

  constructor(private listId: string, private task: Task) {
    super("single-task", listId, false, `${listId}-task-single-${task.taskId}`);

    this.taskNameEle = this.element.querySelector("h4") as HTMLHeadElement;
    this.taskNameEle.innerHTML = task.title;

    this.taskDescriptionEle = this.element.querySelector(
      "p"
    ) as HTMLParagraphElement;
    this.taskDescriptionEle.innerHTML = task.description;
  }
  render(item: Task): void {}
}

class TaskList extends Component<Task[], HTMLDivElement, HTMLDivElement> {
  taskListTitle: HTMLHeadingElement;
  taskListElement: HTMLUListElement;

  constructor(private taskType: TaskStatus) {
    const listId = `task-list-projects-${taskType}`.toLowerCase();
    super("task-list", "task-list-wrapper", false, listId);

    const listElement = this.element.querySelector(
      `#${listId} > ul`
    ) as HTMLUListElement;
    listElement.id = `${listId}-ul`;
    this.taskListElement = listElement;

    this.taskListTitle = this.element.querySelector(
      `header > h2`
    ) as HTMLHeadingElement;
    this.taskListTitle.innerHTML = taskType;
  }

  render(taskList: Task[]): void {
    this.taskListElement.innerHTML = "";
    const tasksByType = taskList.filter((e) => e.status === this.taskType);

    for (const task of tasksByType) {
      new TaskItem(this.taskListElement.id, task);
    }
  }
}

class TaskForm extends Component<void, HTMLDivElement, HTMLDivElement> {
  private taskService!: TaskService;
  private taskFormElement: HTMLFormElement;

  private taskTitle: HTMLInputElement;
  private taskDescription: HTMLTextAreaElement;
  private taskLoadingEle: HTMLDivElement;

  constructor() {
    super("task-input", "app", true, "user-input");
    this.taskFormElement = this.element.querySelector(
      "form"
    ) as HTMLFormElement;
    this.taskTitle = this.element.querySelector(
      "#task-name"
    ) as HTMLInputElement;
    this.taskDescription = this.element.querySelector(
      "#task-description"
    ) as HTMLTextAreaElement;
    this.taskLoadingEle = this.element.querySelector(
      ".loading"
    ) as HTMLDivElement;
    this.render();
  }
  render(): void {
    this.taskFormElement.addEventListener(
      "submit",
      this.submitHandler.bind(this)
    );
  }

  displayAddLoading(isLoading: Boolean): void {
    if (isLoading) {
      this.taskLoadingEle.style.display = "block";
    } else {
      this.taskLoadingEle.style.display = "none";
    }
  }

  submitHandler(event: Event) {
    event.preventDefault();
    const taskTitle = this.taskTitle.value;
    const taskDescription = this.taskDescription.value;

    if (taskTitle.trim().length === 0 && taskDescription.trim().length === 0) {
      alert("Please add relevant details to create task!");
      return;
    } else {
      this.taskService.addTask({
        title: taskTitle,
        description: taskDescription,
      });
      this.clearInput();
    }
  }

  clearInput() {
    this.taskTitle.value = "";
    this.taskDescription.value = "";
  }

  registerService(service: TaskService) {
    this.taskService = service;
  }
}

class TaskService {
  constructor(
    private loadingState: State<Boolean>,
    private taskState: State<Task[]>
  ) {}

  addTask(task: TaskInput) {
    this.loadingState.setState(true);
    const tasks = this.taskState.getState();
    const taskToBeAdded: Task = {
      ...task,
      status: TaskStatus.Assigned,
      taskId: Math.random().toString(),
    };
    setTimeout(() => {
      this.taskState.setState([taskToBeAdded, ...tasks]);
      this.loadingState.setState(false);
    }, 300);
  }
}

class App {
  private taskForm: TaskForm;
  private taskList: TaskList;
  private taskListInProgress: TaskList;
  private taskListDone: TaskList;
  private taskState: State<Task[]>;
  private loadingState: State<Boolean>;
  private taskService: TaskService;

  constructor() {
    this.taskForm = new TaskForm();
    this.taskList = new TaskList(TaskStatus.Assigned);
    this.taskListInProgress = new TaskList(TaskStatus.InProgress);
    this.taskListDone = new TaskList(TaskStatus.Done);

    this.loadingState = new State<Boolean>(false, [
      this.taskForm.displayAddLoading.bind(this.taskForm),
    ]);

    this.taskState = new State<Task[]>(
      [],
      [
        this.taskList.render.bind(this.taskList),
        this.taskListInProgress.render.bind(this.taskListInProgress),
        this.taskListDone.render.bind(this.taskListDone),
      ]
    );

    this.taskService = new TaskService(this.loadingState, this.taskState);
    this.taskForm.registerService(this.taskService);
  }
}

new App();
