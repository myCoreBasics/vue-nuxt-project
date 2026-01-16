export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  
  if (!config.googleClientId || !config.googleClientSecret) {
    throw createError({
      statusCode: 500,
      message: 'Google OAuth 설정이 되어있지 않습니다.'
    })
  }

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + new URLSearchParams({
    client_id: config.googleClientId,
    redirect_uri: `${getRequestURL(event).origin}/api/auth/callback/google`,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline'
  })

  return sendRedirect(event, authUrl)
})
