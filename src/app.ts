enum TaskStatus {
  Assigned,
  InProgress,
  Done,
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

abstract class Component<T> {
  abstract render(item: T): void;
}

class TaskItem extends Component<Task> {
    constructor() {
        super();
    }
  render(item: Task): void {
    console.log("Render taskItem: ", item);
  }
}

class TaskList extends Component<Task[]> {
  taskItem: TaskItem;
  constructor() {
    super();
    console.log("In Task List Constructor...");
    this.taskItem = new TaskItem();
  }
  render(taskList: Task[]): void {
    console.log("In Task List Render...taskList=", taskList, this);
    // for (const task of taskList) {
    //   this.taskItem.render(task);
    // }
  }

  displayListLoading(loading: Boolean): void {
    console.log("In Display Loading..loading=", loading);
  }
}

class TaskForm extends Component<void> {
  private taskService!: TaskService;
  constructor() {
    super();
    console.log("In Task Form Constructor...");
  }
  render(): void {
    console.log("In Task Form Render...");
  }

  registerService(service: TaskService) {
    console.log("In Task Form: Add Task...");

    this.taskService = service;
    this.taskService?.addTask({
      title: "Task 1",
      description: "This is description for task 1",
    });
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
    this.taskState.setState([taskToBeAdded, ...tasks]);
    this.loadingState.setState(false);
  }
}

class App {
  private taskForm: TaskForm;
  private taskList: TaskList;
  private taskState: State<Task[]>;
  private loadingState: State<Boolean>;
  private taskService: TaskService;

  constructor() {
    this.taskForm = new TaskForm();
    this.taskList = new TaskList();

    this.loadingState = new State<Boolean>(false, [
      this.taskList.displayListLoading,
    ]);
    this.taskState = new State<Task[]>([], [this.taskList.render]);

    this.taskService = new TaskService(this.loadingState, this.taskState);
    this.taskForm.registerService(this.taskService);
  }
}

new App();
