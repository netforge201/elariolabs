sed -i '' 's/export async function savePage(formData: FormData, id?: string) {/export async function savePage(formData: FormData) {\
  const id = formData.get("id") as string;/g' src/app/admin/\(dashboard\)/pages/actions.ts
