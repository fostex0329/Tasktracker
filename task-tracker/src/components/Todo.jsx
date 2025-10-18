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
        <div className="flex items-start space-x-2 p-2 border rounded-lg">
            <Checkbox 
                checked={todo.completed} 
                onCheckedChange={handleTodoClick} 
                className={cn(
                    "mt-1 h-5 w-5 border border-current text-current",
                    "data-[state=checked]:bg-transparent data-[state=checked]:text-current",
                    checkboxTone
                )} // テキストと同じ色と太さに揃える
            />
            <div className="flex-1">
                <span className={labelTone}>{todo.name}</span>
                {todo.remindAt && (
                    <div className="text-sm text-gray-500 mt-1">
                        📅 リマインド: {formatRemindAt(todo.remindAt)}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Todo;
