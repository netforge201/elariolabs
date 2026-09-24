sed -i '' 's/export async function saveArticle(formData: FormData, id?: string) {/export async function saveArticle(formData: FormData) {\
  const id = formData.get("id") as string;/g' src/app/admin/\(dashboard\)/blog/actions.ts
