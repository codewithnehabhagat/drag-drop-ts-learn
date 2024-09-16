"use strict";
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["Assigned"] = "Assigned";
    TaskStatus["InProgress"] = "InProgress";
    TaskStatus["Done"] = "Done";
})(TaskStatus || (TaskStatus = {}));
class State {
    constructor(defaultValue, stateChangeListeners = []) {
        this.stateChangeListeners = [];
        this.stateVariable = defaultValue;
        this.stateChangeListeners = stateChangeListeners;
        this.setState(this.stateVariable);
    }
    setState(updatedState, executeListener = true) {
        this.stateVariable = updatedState;
        if (executeListener) {
            for (const listenerFn of this.stateChangeListeners) {
                listenerFn(updatedState);
            }
        }
    }
    getState() {
        return this.stateVariable;
    }
}
class Component {
    constructor(templateId, hostEleId, insertBefore, newElementId) {
        this.templateElement = document.getElementById(templateId);
        this.hostElement = document.getElementById(hostEleId);
        const node = document.importNode(this.templateElement.content, true);
        this.element = node.firstElementChild;
        if (newElementId) {
            this.element.id = newElementId;
        }
        this.hostElement.insertAdjacentElement(insertBefore ? "afterbegin" : "beforeend", this.element);
    }
}
class TaskItem extends Component {
    constructor(listId, task) {
        super("single-task", listId, false, `${listId}-task-single-${task.taskId}`);
        this.task = task;
        this.element.addEventListener("dragstart", this.handleDragStart.bind(this));
        this.element.addEventListener("dragend", this.handleDragEnd.bind(this));
        this.taskNameEle = this.element.querySelector("h4");
        this.taskNameEle.innerHTML = task.title;
        this.taskDescriptionEle = this.element.querySelector("p");
        this.taskDescriptionEle.innerHTML = task.description;
    }
    render() { }
    // Handle drag start event
    handleDragStart(event) {
        var _a;
        const target = event.target;
        if (target.id === this.element.id) {
            // Store the dragged item id in the dataTransfer object
            (_a = event.dataTransfer) === null || _a === void 0 ? void 0 : _a.setData("text/plain", JSON.stringify({ listId: target.id, taskId: this.task.taskId }));
            target.classList.add("dragging");
        }
    }
    // Handle drag end event
    handleDragEnd(event) {
        const target = event.target;
        if (target.id === this.element.id) {
            target.classList.remove("dragging");
        }
    }
}
class TaskList extends Component {
    constructor(taskType) {
        const listId = `task-list-projects-${taskType}`.toLowerCase();
        super("task-list", "task-list-wrapper", false, listId);
        this.taskType = taskType;
        const listElement = this.element.querySelector(`#${listId} > ul`);
        listElement.id = `${listId}-ul`;
        this.taskListElement = listElement;
        this.element.addEventListener("dragover", this.handleDragOver.bind(this));
        this.element.addEventListener("drop", this.handleDrop.bind(this));
        this.taskListTitle = this.element.querySelector(`header > h2`);
        this.taskListTitle.innerHTML = taskType;
    }
    handleDragOver(event) {
        event.preventDefault();
    }
    handleDrop(event) {
        var _a;
        event.preventDefault();
        const target = event.target;
        const eventDataString = (_a = event.dataTransfer) === null || _a === void 0 ? void 0 : _a.getData("text/plain");
        if (eventDataString) {
            const eventData = JSON.parse(eventDataString);
            if (target.classList.contains("task-list") &&
                (eventData === null || eventData === void 0 ? void 0 : eventData.listId) &&
                (eventData === null || eventData === void 0 ? void 0 : eventData.taskId)) {
                if (eventData === null || eventData === void 0 ? void 0 : eventData.taskId) {
                    this.taskService.changeStatus(eventData.taskId, this.taskType);
                }
                const draggedElement = document.getElementById(eventData.listId);
                if (draggedElement) {
                    target.appendChild(draggedElement);
                }
            }
        }
    }
    render(taskList) {
        this.taskListElement.innerHTML = "";
        const tasksByType = taskList.filter((e) => e.status === this.taskType);
        for (const task of tasksByType) {
            new TaskItem(this.taskListElement.id, task);
        }
    }
    registerService(service) {
        this.taskService = service;
    }
}
class TaskForm extends Component {
    constructor() {
        super("task-input", "app", true, "user-input");
        this.taskFormElement = this.element.querySelector("form");
        this.taskTitle = this.element.querySelector("#task-name");
        this.taskDescription = this.element.querySelector("#task-description");
        this.taskLoadingEle = this.element.querySelector(".loading");
        this.render();
    }
    render() {
        this.taskFormElement.addEventListener("submit", this.submitHandler.bind(this));
    }
    displayAddLoading(isLoading) {
        if (isLoading) {
            this.taskLoadingEle.style.display = "block";
        }
        else {
            this.taskLoadingEle.style.display = "none";
        }
    }
    submitHandler(event) {
        event.preventDefault();
        const taskTitle = this.taskTitle.value;
        const taskDescription = this.taskDescription.value;
        if (taskTitle.trim().length === 0 && taskDescription.trim().length === 0) {
            alert("Please add relevant details to create task!");
            return;
        }
        else {
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
    registerService(service) {
        this.taskService = service;
    }
}
class TaskService {
    constructor(loadingState, taskState) {
        this.loadingState = loadingState;
        this.taskState = taskState;
    }
    addTask(task) {
        this.loadingState.setState(true);
        const tasks = this.taskState.getState();
        const taskToBeAdded = Object.assign(Object.assign({}, task), { status: TaskStatus.Assigned, taskId: Math.random().toString() });
        setTimeout(() => {
            this.taskState.setState([taskToBeAdded, ...tasks]);
            this.loadingState.setState(false);
        }, 300);
    }
    changeStatus(taskId, status) {
        const task = this.findTaskById(taskId);
        if (task) {
            task.status = status;
            this.taskState.setState([...this.taskState.getState()]);
        }
    }
    findTaskById(taskId) {
        return this.taskState.getState().find((e) => e.taskId === taskId);
    }
}
class App {
    constructor() {
        this.taskForm = new TaskForm();
        this.taskList = new TaskList(TaskStatus.Assigned);
        this.taskListInProgress = new TaskList(TaskStatus.InProgress);
        this.taskListDone = new TaskList(TaskStatus.Done);
        this.loadingState = new State(false, [
            this.taskForm.displayAddLoading.bind(this.taskForm),
        ]);
        this.taskState = new State([], [
            this.taskList.render.bind(this.taskList),
            this.taskListInProgress.render.bind(this.taskListInProgress),
            this.taskListDone.render.bind(this.taskListDone),
        ]);
        this.taskService = new TaskService(this.loadingState, this.taskState);
        this.taskForm.registerService(this.taskService);
        this.taskList.registerService(this.taskService);
        this.taskListInProgress.registerService(this.taskService);
        this.taskListDone.registerService(this.taskService);
    }
}
new App();
//# sourceMappingURL=app.js.map