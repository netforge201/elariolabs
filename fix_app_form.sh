sed -i '' 's/import { useActionState } from '\''react'\'';/import SubmitButton from '\''@\/components\/admin\/SubmitButton'\'';/g' src/app/admin/\(dashboard\)/apps/AppForm.tsx
sed -i '' 's/const \[state, formAction, isPending\] = useActionState.*/ /g' src/app/admin/\(dashboard\)/apps/AppForm.tsx
sed -i '' 's/<form action={formAction}/<form action={saveApplication}/g' src/app/admin/\(dashboard\)/apps/AppForm.tsx
sed -i '' 's/{state?.error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">{state.error}<\/div>}/<input type="hidden" name="id" value={initialData?.id || '\'''\''} \/>/g' src/app/admin/\(dashboard\)/apps/AppForm.tsx
sed -i '' 's/<button type="submit" disabled={isPending} className="bg-black text-white dark:bg-white dark:text-black px-6 py-2 rounded-md font-medium disabled:opacity-50">{isPending ? '\''Saving...'\'' : '\''Save Application'\''}<\/button>/<SubmitButton>Save Application<\/SubmitButton>/g' src/app/admin/\(dashboard\)/apps/AppForm.tsx
