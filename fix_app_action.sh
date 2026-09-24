sed -i '' 's/export async function saveApplication(formData: FormData, id?: string) {/export async function saveApplication(formData: FormData) {\
  const id = formData.get("id") as string;/g' src/app/admin/\(dashboard\)/apps/actions.ts
