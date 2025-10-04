import React from 'react';
import { Checkbox } from '@/components/ui/checkbox'; // Shadcn UI の Checkbox コンポーネントをインポート

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

    return (
        <div className="flex items-start space-x-2 p-2 border rounded-lg">
            <Checkbox 
                checked={todo.completed} 
                onCheckedChange={handleTodoClick} 
                className="h-5 w-5 border-primary-500 focus:ring-primary-500 data-[state=checked]:border-transparent mt-1" // ボーダーの色とフォーカス時のリングの色を変更
            />
            <div className="flex-1">
                <span className={todo.completed ? "line-through text-gray-500" : ""}>{todo.name}</span>
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