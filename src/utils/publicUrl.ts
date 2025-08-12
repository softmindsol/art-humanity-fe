export const getImageUrl = (url = "") => {
  if (!url) return "";

  // If URL already starts with http/https, just return as is
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  // Otherwise build it from base URL
  let baseUrl = import.meta.env.VITE_BASE_URL.replace(/\/api(\/v1)?\/?$/, "");
  let cleanedPath = url
    .replace(/^\/?public\/temp\/?/, "")
    .replace(/^\/?public\//, "");

  return `${baseUrl}/uploads/projects/${cleanedPath}`;
};
