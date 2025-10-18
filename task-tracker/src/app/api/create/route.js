// タスク作成API
const MAX_NOTE_LENGTH = 280;

export async function POST(request) {
  try {
    const data = await request.json();
    
    // データの検証
    if (!data.name) {
      return Response.json({ error: "タスク名は必須です" }, { status: 400 });
    }

    let note = null;
    if (data.note !== undefined && data.note !== null) {
      if (typeof data.note !== "string") {
        return Response.json({ error: "メモは文字列で指定してください" }, { status: 400 });
      }
      const trimmedNote = data.note.trim();
      if (trimmedNote.length > MAX_NOTE_LENGTH) {
        return Response.json({ error: `メモは${MAX_NOTE_LENGTH}文字以内で入力してください` }, { status: 400 });
      }
      note = trimmedNote.length > 0 ? trimmedNote : null;
    }

    // リマインド日時の検証
    let remindAt = null;
    if (data.remindAt) {
      const remindDate = new Date(data.remindAt);
      if (isNaN(remindDate.getTime())) {
        return Response.json({ error: "無効な日時です" }, { status: 400 });
      }
      remindAt = remindDate.toISOString();
    }

    // 新しいタスクオブジェクトを作成
    const newTodo = {
      id: crypto.randomUUID(),  // uuidv4の代わりに組み込みのUUID生成を使用
      name: data.name,
      completed: false,
      remindAt: remindAt,
      note,
    };

    // 新しいタスクを返す
    return Response.json(newTodo);
  } catch (error) {
    return Response.json(
      { error: "サーバーエラーが発生しました" }, 
      { status: 500 });
  }
}
