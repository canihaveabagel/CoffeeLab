export const getLoginUrl = () => {
  if (typeof window === "undefined") return "/signin-with-chatgpt";
  const returnTo = `${window.location.pathname}${window.location.search}`;
  return `/signin-with-chatgpt?return_to=${encodeURIComponent(returnTo)}`;
};
