export const getAdminContactUrl = (email, subject) => {
  const url = new URL('https://mail.google.com/mail/')
  url.searchParams.set('view', 'cm')
  url.searchParams.set('fs', '1')
  url.searchParams.set('to', email || '')
  url.searchParams.set('su', subject)
  return url.toString()
}
