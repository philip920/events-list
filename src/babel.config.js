// eslint-disable-next-line import/no-anonymous-default-export
export default function (api) {
  api.cache(true);

  const presets = ["@babel/preset-react"];

  return {
    presets
  };
}