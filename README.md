# sticky notes

Project repository: [GitHub](https://github.com/fomin-max/sticky-notes)

- [Description](#Description)
- [Technology](#Technology)
- [Development](#Development)
- [Contributors](#Contributors)


## Description

Single-page web application for sticky notes.

Features:

1. Create a new note of the specified size at the specified position.
2. Change note size by dragging.
3. Move a note by dragging.
4. Remove a note by dragging it over a predefined "trash" zone.


## Technology

- [TypeScript](https://www.typescriptlang.org)
- [jQuery](https://jquery.com/)
- [underscore](https://underscorejs.org/)


## Development

- [Project start](#Project start)
- [NPM scripts](#NPM scripts)


### Project start

```javascript
npm i
```

```javascript
npm start
```

```javascript
http://localhost:8000/
```



## NPM scripts

```
npm start        : project start on localhost
npm run build    : project build with the settings for production, will not be completed if check failed `npm run check`
npm run check    : lint & TypeScript errors check
npm run lint     : lint errors check
npm run tsc      : TypeScript errors check
```


## Contributors
- Fomin Max (fominmax@inbox.ru)
