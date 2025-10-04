// タスク作成API
export async function POST(request) {
  try {
    const data = await request.json();
    
    // データの検証
    if (!data.name) {
      return Response.json({ error: "タスク名は必須です" }, { status: 400 });
    }

    // リマインド日時の検証
    let remindAt = null;
    if (data.remindAt) {
      const remindDate = new Date(data.remindAt);
      if (isNaN(remindDate.getTime())) {
        return Response.json({ error: "無効な日時です" }, { status: 400 });
      }
      // 過去の日時でないかチェック
      if (remindDate < new Date()) {
        return Response.json({ error: "リマインド日時は未来の日時を指定してください" }, { status: 400 });
      }
      remindAt = remindDate.toISOString();
    }

    // 新しいタスクオブジェクトを作成
    const newTodo = {
      id: crypto.randomUUID(),  // uuidv4の代わりに組み込みのUUID生成を使用
      name: data.name,
      completed: false,
      remindAt: remindAt,
    };

    // 新しいタスクを返す
    return Response.json(newTodo);
  } catch (error) {
    return Response.json(
      { error: "サーバーエラーが発生しました" }, 
      { status: 500 });
  }
}
