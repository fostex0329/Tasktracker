import React from 'react';
import { Checkbox } from '@/components/ui/checkbox'; // Shadcn UI の Checkbox コンポーネントをインポート
import { cn } from '@/lib/utils';

const Todo = ({ todo, toggleTodo }) => {
    const handleTodoClick = () => {
        toggleTodo(todo.id);
    };

    // リマインド日時のフォーマット
    const formatRemindAt = (remindAt) => {
        if (!remindAt) return null;
        const date = new Date(remindAt);
        return date.toLocaleString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const isCompleted = !!todo.completed;
    const checkboxTone = isCompleted ? "text-gray-500" : "text-foreground";
    const labelTone = isCompleted ? "line-through text-gray-500" : "text-foreground";

    return (
        <div className="group flex w-full max-w-full flex-col gap-1 overflow-hidden rounded-lg border p-3 transition-colors hover:bg-muted/40">
            <div className="flex w-full items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                    <Checkbox
                        checked={todo.completed}
                        onCheckedChange={handleTodoClick}
                        className={cn(
                            "h-5 w-5 border border-current text-current",
                            "data-[state=checked]:bg-transparent data-[state=checked]:text-current",
                            checkboxTone
                        )} // テキストと同じ色と太さに揃える
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <span className={cn("block min-w-0 break-words text-[15px]", labelTone)} title={todo.name}>
                        {todo.name}
                    </span>
                </div>
            </div>
            {todo.remindAt && (
                <div className="pl-10 text-sm text-gray-500">
                    📅 リマインド: {formatRemindAt(todo.remindAt)}
                </div>
            )}
        </div>
    );
};

export default Todo;
