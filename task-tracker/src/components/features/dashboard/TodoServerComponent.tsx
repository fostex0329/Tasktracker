// src/components/features/dashboard/TodoServerComponent.tsx
import { Todo } from "@/lib/types";
import SectionCard from "@/components/common/SectionCard";
import DayCard from "./schedule/DayCard";
import TaskRow from "./schedule/TaskRow";
import { 
  groupByMonth, 
  groupByDate, 
  isTodayISO,
  formatJPYearMonth
} from "@/lib/utils/date";

interface TodoServerComponentProps {
  todos: Todo[];
}

export default function TodoServerComponent({ todos }: TodoServerComponentProps) {
  const groupedByMonth = groupByMonth(todos);
  const groupedByDate = groupByDate(todos);

  return (
    <>
      {/* Today's Tasks */}
      <SectionCard title="今日のタスク" className="mb-8">
        {groupedByDate.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            タスクがありません
          </p>
        ) : (
          <div className="space-y-4">
            {groupedByDate.map(([date, dateTodos]) => {
              const isToday = isTodayISO(date + "T00:00:00");
              if (!isToday) return null;
              
              return (
                <DayCard key={date} date={date}>
                  <div className="space-y-2">
                    {dateTodos.map((todo) => (
                      <TaskRow
                        key={todo.id}
                        todo={todo}
                        isEditing={false}
                        editingText=""
                        editingRemindAt=""
                        onToggle={() => {}}
                        onDelete={() => {}}
                        onStartEdit={() => {}}
                        onSaveEdit={() => {}}
                        onCancelEdit={() => {}}
                        onTextChange={() => {}}
                        onRemindAtChange={() => {}}
                        onKeyPress={() => {}}
                      />
                    ))}
                  </div>
                </DayCard>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* Monthly Tasks */}
      <SectionCard title="今月のタスク">
        {groupedByMonth.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            タスクがありません
          </p>
        ) : (
          <div className="space-y-6">
            {groupedByMonth.map(([monthKey, monthTodos]) => (
              <div key={monthKey}>
                <h3 className="text-lg font-semibold mb-4">
                  {formatJPYearMonth(monthKey)}
                </h3>
                <div className="space-y-4">
                  {groupByDate(monthTodos).map(([date, dateTodos]) => (
                    <DayCard key={date} date={date}>
                      <div className="space-y-2">
                        {dateTodos.map((todo) => (
                          <TaskRow
                            key={todo.id}
                            todo={todo}
                            isEditing={false}
                            editingText=""
                            editingRemindAt=""
                            onToggle={() => {}}
                            onDelete={() => {}}
                            onStartEdit={() => {}}
                            onSaveEdit={() => {}}
                            onCancelEdit={() => {}}
                            onTextChange={() => {}}
                            onRemindAtChange={() => {}}
                            onKeyPress={() => {}}
                          />
                        ))}
                      </div>
                    </DayCard>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </>
  );
}
