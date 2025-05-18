// タスク作成API
export async function POST(request) {
  try {
    const data = await request.json();
    
    // データの検証
    if (!data.name) {
      return Response.json({ error: "タスク名は必須です" }, { status: 400 });
    }

    // 新しいタスクオブジェクトを作成
    const newTodo = {
      id: crypto.randomUUID(),  // uuidv4の代わりに組み込みのUUID生成を使用
      name: data.name,
      completed: false,
    };

    // 新しいタスクを返す
    return Response.json(newTodo);
  } catch (error) {
    return Response.json(
      { error: "サーバーエラーが発生しました" }, 
      { status: 500 });
  }
}
