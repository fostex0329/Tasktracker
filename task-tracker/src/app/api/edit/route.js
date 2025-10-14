// タスク編集API
export async function POST(request) {
  try {
    const data = await request.json();
    const id = data?.id;
    const name = typeof data?.name === "string" ? data.name.trim() : undefined;
    const rawRemindAt = data?.remindAt ?? undefined; // null を明示的に許容

    if (!id || typeof id !== "string") {
      return Response.json({ error: "無効なIDです" }, { status: 400 });
    }

    if (name !== undefined && name.length === 0) {
      return Response.json({ error: "タスク名が空です" }, { status: 400 });
    }

    let remindAt = undefined; // undefined: 変更なし, null: 解除, string: ISO
    if (rawRemindAt !== undefined) {
      if (rawRemindAt === null || rawRemindAt === "") {
        remindAt = null; // 解除
      } else {
        const dt = new Date(rawRemindAt);
        if (Number.isNaN(dt.getTime())) {
          return Response.json({ error: "無効な日時です" }, { status: 400 });
        }
        // 過去の日時を許容するかはユースケースによる。ここでは許容。
        remindAt = dt.toISOString();
      }
    }

    // サンプル実装: 永続層は持たないため、正規化したフィールドを返すのみ。
    return Response.json({ id, ...(name !== undefined ? { name } : {}), ...(rawRemindAt !== undefined ? { remindAt } : {}) });
  } catch (error) {
    return Response.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}


