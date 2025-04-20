import React from 'react';
import { Checkbox } from '@/components/ui/checkbox'; // Shadcn UI の Checkbox コンポーネントをインポート

const Todo = ({ todo, toggleTodo }) => {
    const handleTodoClick = () => {
        toggleTodo(todo.id);
    };

    return (
        <div className="flex items-center space-x-2">
            <Checkbox 
                checked={todo.completed} 
                onCheckedChange={handleTodoClick} 
                className="h-5 w-5 border-primary-500 focus:ring-primary-500 data-[state=checked]:border-transparent" // ボーダーの色とフォーカス時のリングの色を変更
            />
            <span>{todo.name}</span>
        </div>
    );
};

export default Todo;