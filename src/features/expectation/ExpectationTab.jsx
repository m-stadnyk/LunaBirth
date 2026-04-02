import { CountdownDisplay } from "./CountdownDisplay.jsx";
import { TodoList } from "./TodoList.jsx";

export function ExpectationTab({
  dueDate,
  setDueDate,
  countdownFormat,
  setCountdownFormat,
  tasks,
  addTask,
  toggleDone,
  removeTask,
  updateTask,
}) {
  return (
    <>
      <CountdownDisplay
        dueDate={dueDate}
        countdownFormat={countdownFormat}
        setCountdownFormat={setCountdownFormat}
        setDueDate={setDueDate}
      />
      <TodoList
        tasks={tasks}
        addTask={addTask}
        toggleDone={toggleDone}
        removeTask={removeTask}
        updateTask={updateTask}
      />
    </>
  );
}
