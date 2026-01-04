let mapData;
let isDragging = false;

(() => {
    mapData = createEmptyMap();
    function applyBorders() {
        const app = document.getElementById('app');

        try {
            // On load, apply saved theme preference
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme) {
                document.body.setAttribute('data-theme', savedTheme);
            }
        }
        catch {
            // ignore if DOM/window not available
        }

        window.onkeyup = (e) => {
            if (e.key === 'x') {
                const activeCells = document.querySelectorAll('div.cell.active');
                activeCells.forEach(cell => {
                    while (cell.firstChild) {
                        clearCell(cell);
                    }
                    cell.classList.remove('active');
                });
            }

            if (e.key === 'r') {
                const activeCells = document.querySelectorAll('div.cell.active');
                activeCells.forEach(cell => {
                    const tiles = cell.querySelectorAll('img');
                    tiles.forEach(tile => {
                        const currentRotation = (tile.style.transform || '').match(/rotate\((\d+)deg\)/);
                        let angle = 0;
                        if (currentRotation && currentRotation.length === 2) {
                            angle = parseInt(currentRotation[1]);
                        }
                        angle = (angle + 90) % 360;

                        tile.style.transformOrigin = '0 0';
                        switch (angle) {
                            case 0:
                                tile.style.transform = 'rotate(0deg)';
                                break;
                            case 90:
                                tile.style.transform = 'rotate(90deg) translate(0, -100%)';
                                break;
                            case 180:
                                tile.style.transform = 'rotate(180deg) translate(-100%, -100%)';
                                break;
                            case 270:
                                tile.style.transform = 'rotate(270deg) translate(-100%, 0)';
                                break;
                        }

                        mapData.cells.find(c => c.x === cell.getAttribute('data-col') && c.y === cell.getAttribute('data-row') && c.src === tile.src).angle = angle;
                    });
                });
            }

            if (e.key === 'd' || e.key === 'Escape') {
                const activeCells = document.querySelectorAll('div.cell.active');
                activeCells.forEach(deactivateCell);
            }

            if (e.key === 'n') {
                const activeCells = document.querySelectorAll('div.cell.active');

                if (activeCells.length === 0) return;

                const textInput = document.createElement('input');
                textInput.type = 'text';
                textInput.style.position = 'fixed';
                textInput.style.top = '100px';
                document.body.appendChild(textInput);
                textInput.focus();

                textInput.onblur = () => {
                    const value = textInput.value;
                    document.body.removeChild(textInput);

                    activeCells.forEach(cell => {
                        const x = parseInt(cell.getAttribute('data-col'));
                        const y = parseInt(cell.getAttribute('data-row'));

                        if (textInput !== null) {
                            const diceValue = value.trim();

                            const diceCell = document.createElement('div');
                            diceCell.className = 'dice-cell' + (diceValue.length > 2 ? ' small-font' : '');
                            diceCell.textContent = diceValue;

                            const existingImg = cell.querySelector('img');
                            if (existingImg) {
                                cell.removeChild(existingImg);
                            }

                            const filteredCells = mapData.cells.filter(c => parseInt(c.x) === x && parseInt(c.y) === y);
                            mapData.cells = mapData.cells.filter(c => !filteredCells.includes(c));
                            mapData.cells.push({ x: x, y: y, type: 'Dice', angle: 0, diceValue: diceValue });

                            cell.appendChild(diceCell);
                        }

                        cell.classList.remove('active');
                    });
                }
            }

            if (e.key === 'o') {
                const activeCells = document.querySelectorAll('div.cell.active');

                activeCells.forEach(cell => {
                    const x = parseInt(cell.getAttribute('data-col'));
                    const y = parseInt(cell.getAttribute('data-row'));
                    cell.classList.toggle('out-of-bounds');

                    if (mapData.cells.find(c => c.x === x && c.y === y)) {
                        const filteredCells = mapData.cells.filter(c => c.x === x && c.y === y);
                        mapData.cells = mapData.cells.filter(c => !filteredCells.includes(c));
                    }
                    else {
                        mapData.cells.push({ x: x, y: y, type: 'OutOfBounds' });
                    }

                    deactivateCell(cell);
                });
            }
        }

        const descriptionToggle = document.createElement('button');
        descriptionToggle.id = 'description-toggle';
        descriptionToggle.innerText = 'Description';
        descriptionToggle.onclick = () => {
            const desc = document.getElementById('description');
            desc.style.display = (desc.style.display === 'none' || desc.style.display === '') ? 'block' : 'none';

            const notes = document.getElementById('notes');
            notes.style.display = 'none';
        };
        app.appendChild(descriptionToggle);

        const description = document.createElement('textarea');
        description.id = 'description';
        description.placeholder = 'Map Description';
        description.value = mapData.description || '';
        description.onchange = () => {
            mapData.description = description.value;
        };
        app.appendChild(description);

        const notesToggle = document.createElement('button');
        notesToggle.id = 'notes-toggle';
        notesToggle.innerText = 'Notes';
        notesToggle.onclick = () => {
            const desc = document.getElementById('description');
            desc.style.display = 'none';

            const notes = document.getElementById('notes');
            notes.style.display = (notes.style.display === 'none' || notes.style.display === '') ? 'block' : 'none';
        };
        app.appendChild(notesToggle);

        const notes = document.createElement('textarea');
        notes.id = 'notes';
        notes.placeholder = 'Map Notes';
        notes.value = mapData.notes || '';
        notes.onchange = () => {
            mapData.notes = notes.value;
        };
        app.appendChild(notes);

        const title = document.createElement('input');
        title.id = 'title';
        title.type = 'text';
        title.placeholder = 'Map Title';
        title.value = mapData.title || '';
        title.onchange = () => {
            mapData.title = title.value;
        };
        app.appendChild(title);

        const trapPicker = document.createElement('div');
        trapPicker.id = 'trap-picker';
        app.appendChild(trapPicker);

        const trapIcons = (window.api && typeof window.api.getTrapIcons === 'function') ? window.api.getTrapIcons() : [];

        trapIcons.forEach(icon => {
            const iconElement = document.createElement('img');
            iconElement.src = `images/traps/${icon}`;
            iconElement.title = icon.replace('.png', '');

            iconElement.onclick = () => { addGridTile(iconElement.title, iconElement.src, null); };

            trapPicker.appendChild(iconElement);
        });

        const specialPicker = document.createElement('div');
        specialPicker.id = 'special-picker';
        app.appendChild(specialPicker);

        const specialIcons = (window.api && typeof window.api.getSpecialIcons === 'function') ? window.api.getSpecialIcons() : [];

        specialIcons.forEach(icon => {
            const iconElement = document.createElement('img');
            iconElement.src = `images/special/${icon}`;
            iconElement.title = (icon === 'Dice.png' ? 'Dice Roll' : icon.replace('.png', ''));

            iconElement.onclick = () => { addGridTile(iconElement.title, iconElement.src, null); };

            specialPicker.appendChild(iconElement);
        });

        renderMap(mapData);

        const monsterPicker = document.createElement('div');
        monsterPicker.id = 'monster-picker';
        app.appendChild(monsterPicker);

        const monsterIcons = (window.api && typeof window.api.getMonsterIcons === 'function') ? window.api.getMonsterIcons() : [];

        monsterIcons.forEach(icon => {
            const iconElement = document.createElement('img');
            iconElement.src = `images/monsters/${icon}`;
            iconElement.title = icon.replace('.png', '');

            iconElement.onclick = () => { addGridTile(iconElement.title, iconElement.src, null); };

            monsterPicker.appendChild(iconElement);
        });

        const rubblePicker = document.createElement('div');
        rubblePicker.id = 'rubble-picker';
        app.appendChild(rubblePicker);

        const rubbleIcons = (window.api && typeof window.api.getRubbleIcons === 'function') ? window.api.getRubbleIcons() : [];

        rubbleIcons.forEach(icon => {
            const iconElement = document.createElement('img');
            iconElement.src = `images/rubble/${icon}`;
            iconElement.title = icon.replace('.png', '');

            const probe = new Image();
            probe.onload = () => {
                const w = probe.naturalWidth;
                const h = probe.naturalHeight;
                const displayW = Math.round(32 * (w / 256));
                const displayH = Math.round(32 * (h / 256));
                iconElement.style.width = `${displayW}px`;
                iconElement.style.height = `${displayH}px`;
            };
            probe.src = iconElement.src;

            iconElement.onclick = () => { addGridTile(iconElement.title, iconElement.src, null); };

            rubblePicker.appendChild(iconElement);
        });

        const furniturePicker = document.createElement('div');
        furniturePicker.id = 'furniture-picker';
        app.appendChild(furniturePicker);

        const furnitureIcons = (window.api && typeof window.api.getFurnitureIcons === 'function') ? window.api.getFurnitureIcons() : [];

        furnitureIcons.forEach(icon => {
            const iconElement = document.createElement('img');
            iconElement.src = `images/furniture/${icon}`;
            iconElement.title = icon.replace('.png', '');

            const probe = new Image();
            probe.src = iconElement.src;
            probe.onload = () => {
                const w = probe.naturalWidth;
                const h = probe.naturalHeight;
                const displayW = Math.round(32 * (w / 256));
                const displayH = Math.round(32 * (h / 256));
                iconElement.style.width = `${displayW}px`;
                iconElement.style.height = `${displayH}px`;
            };

            iconElement.onclick = () => { addGridTile(iconElement.title, iconElement.src, null); };

            furniturePicker.appendChild(iconElement);
        });
    }

    function activateCell(cell) {
        cell.classList.add('active');

        const tiles = cell.querySelectorAll('img, .dice-cell');
        tiles.forEach(tile => {
            tile.style.opacity = '0.3';
        });
    }

    function deactivateCell(cell) {
        cell.classList.remove('active');
        if (cell.firstChild) {
            cell.firstChild.style.opacity = '1.0';
        }
    }

    function createEmptyMap() {
        return {
            title: '',
            description: '',
            notes: '',
            width: 26,
            height: 19,
            cells: []
        };
    }

    window.api.onNew(() => {
        mapData = createEmptyMap();

        const title = document.getElementById('title');
        title.value = '';

        const description = document.getElementById('description');
        description.value = '';

        const notes = document.getElementById('notes');
        notes.value = '';

        renderMap(mapData);
    });

    window.api.onOpen((_, payload) => {
        function tryParse(s) {
            try {
                return JSON.parse(s);
            } catch (e) {
                return null;
            }
        }

        function sanitizeText(s) {
            const lines = s.split(/\r?\n/);

            // Quote unquoted keys like: angle: 90  -> "angle": 90
            for (let i = 0; i < lines.length; i++) {
                lines[i] = lines[i].replace(/^(\s*)([A-Za-z0-9_\- ]+)\s*:/, (m, p1, p2) => {
                    // don't re-quote if already quoted
                    if (/^\s*\"/.test(lines[i])) return lines[i];
                    return `${p1}\"${p2}\":`;
                });
            }

            // Insert missing commas between properties when the next non-empty line looks like a key
            for (let i = 0; i < lines.length - 1; i++) {
                const cur = lines[i].trimEnd();
                if (cur === '' || /[,{\[]\s*$/.test(cur) || /,$/.test(cur)) continue;
                // find next non-empty
                let j = i + 1; let next = null;
                while (j < lines.length) { if (lines[j].trim() !== '') { next = lines[j].trim(); break; } j++; }
                if (next && /^[\"A-Za-z0-9_\- ]+\"?\s*:\s*/.test(next)) {
                    // ensure current line ends with a comma
                    lines[i] = lines[i] + ',';
                }
            }

            return lines.join('\n');
        }

        try {
            let data = tryParse(payload.data);
            if (!data) {
                const sanitized = sanitizeText(payload.data);
                data = tryParse(sanitized);
                if (!data) {
                    console.error('Failed to parse map data after sanitization');
                    console.error('Original:', payload.data);
                    console.error('Sanitized:', sanitized);
                    return;
                }
            }
            mapData = data;
            renderMap(mapData);
        } catch (e) {
            console.error('Failed to parse map data:', e);
        }
    });

    window.api.registerGetMapData(() => {
        return JSON.stringify(mapData, null, 2);
    });

    function renderMap(mapData) {
        const cols = mapData.width || 26, rows = mapData.height || 19;

        if (mapData.title) {
            const titleInput = document.getElementById('title');
            if (titleInput) {
                titleInput.value = mapData.title;
            }
        }

        if (mapData.description) {
            const descInput = document.getElementById('description');
            if (descInput) {
                descInput.value = mapData.description;
            }
        }

        if (mapData.notes) {
            const notesInput = document.getElementById('notes');
            if (notesInput) {
                notesInput.value = mapData.notes;
            }
        }

        let grid = document.getElementById('grid')

        if (grid) {
            grid.innerHTML = '';
            grid.parentNode.removeChild(grid);
        }
        else {
            grid = document.createElement('div');
        }

        grid.id = 'grid';

        grid.onmousedown = () => {
            isDragging = true;
        }

        grid.onmouseup = () => {
            isDragging = false;
        }

        grid.onmousemove = (e) => {
            if (isDragging) {
                const cell = document.elementFromPoint(e.clientX, e.clientY);
                activateCell(cell);
            }
        }

        app.appendChild(grid);

        function cellCallback(cell) {
            cell.classList.toggle('active');

            if (cell.firstChild) {
                cell.firstChild.style.opacity = (cell.firstChild.style.opacity === '0.3' ? '1.0' : '0.3');
            }
        }

        for (let r = 0; r < rows; r++) {
            const row = document.createElement('div');
            row.style.display = 'flex';
            for (let c = 0; c < cols; c++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.setAttribute('data-row', r);
                cell.setAttribute('data-col', c);
                cell.onclick = () => cellCallback(cell);

                cell.onmouseup = (e) => {
                    if (e.button === 2) {
                        while (cell.firstChild) {
                            clearCell(cell);
                        }
                    }
                }

                row.appendChild(cell);
            }
            grid.appendChild(row);
        }

        const cells = grid.querySelectorAll('div.cell');
        const cellBorders = (window.api && typeof window.api.readBorders === 'function') ? window.api.readBorders() : [];

        cellBorders.forEach(cell => {
            const x = parseInt(cell.x);
            const y = parseInt(cell.y);
            const borders = cell.borders;

            const cellElement = Array.from(cells).find(c => parseInt(c.getAttribute('data-col')) === x && parseInt(c.getAttribute('data-row')) === y);

            if (cellElement) {
                borders.forEach(border => cellElement.classList.add(`border-${border}`));
            }
        });

        mapData.cells.forEach(cell => {
            const x = parseInt(cell.x);
            const y = parseInt(cell.y);
            const src = cell.src;
            const angle = cell.angle || 0;
            const title = src?.split('/').find(x => x.endsWith('.png')).replace('.png', '') || cell.type;
            const tileCells = cell.cellSpan?.map(c => {
                const col = parseInt(c.x);
                const row = parseInt(c.y);
                return Array.from(cells).find(cellEl => parseInt(cellEl.getAttribute('data-col')) === col && parseInt(cellEl.getAttribute('data-row')) === row);
            }) || [Array.from(cells).find(c => parseInt(c.getAttribute('data-col')) === x && parseInt(c.getAttribute('data-row')) === y)];

            addGridTile(title, src, tileCells, angle, true, cell);
        });
    }

    function clearCell(cell) {
        while (cell.firstChild) {
            cell.removeChild(cell.firstChild);
            const x = parseInt(cell.getAttribute('data-col'));
            const y = parseInt(cell.getAttribute('data-row'));
            const filteredCells = mapData.cells.filter(c => parseInt(c.x) === x && parseInt(c.y) === y);
            mapData.cells = mapData.cells.filter(c => !filteredCells.includes(c));
        }
    }

    function addGridTile(type, src, cells, angle, isLoading = false, cellData = null) {
        cells = cells || document.querySelectorAll('div.cell.active');

        if (type === 'OutOfBounds') {
            cells.forEach(cell => {
                cell.classList.add('out-of-bounds');
            });
            return;
        }

        if (type === 'Door' && cells.length === 2) {
            const dx = Math.abs(parseInt(cells[0].getAttribute('data-col')) - parseInt(cells[1].getAttribute('data-col')));
            const dy = Math.abs(parseInt(cells[0].getAttribute('data-row')) - parseInt(cells[1].getAttribute('data-row')));

            if (dx === 1 && dy === 0) {
                const borderedCells = Array.from(cells).filter(x => x.classList.contains('border-left'));
                const borderedCell = borderedCells.length > 1 ? borderedCells[1] : borderedCells[0];

                if (borderedCell) {
                    const furnitureIcon = document.createElement('img');
                    furnitureIcon.src = src;
                    furnitureIcon.className = 'door-horizontal';
                    borderedCell.appendChild(furnitureIcon);

                    if (!isLoading) {
                        mapData.cells.push({
                            x: borderedCell.getAttribute('data-col'),
                            y: borderedCell.getAttribute('data-row'),
                            src: src,
                            cellSpan: Array.from(cells).map(c => ({ x: c.getAttribute('data-col'), y: c.getAttribute('data-row') }))
                        });
                    }
                }
            } else if (dy === 1 && dx === 0) {
                const borderedCells = Array.from(cells).filter(x => x.classList.contains('border-top'));
                const borderedCell = borderedCells.length > 1 ? borderedCells[1] : borderedCells[0];

                if (borderedCell) {
                    const furnitureIcon = document.createElement('img');
                    furnitureIcon.src = src;
                    furnitureIcon.className = 'door-vertical';
                    furnitureIcon.style.height = '16px';
                    borderedCell.appendChild(furnitureIcon);

                    if (!isLoading) {
                        mapData.cells.push({
                            x: borderedCell.getAttribute('data-col'),
                            y: borderedCell.getAttribute('data-row'),
                            src: src,
                            cellSpan: Array.from(cells).map(c => ({ x: c.getAttribute('data-col'), y: c.getAttribute('data-row') }))
                        });
                    }
                }
            }
        }
        else {
            if (type === 'Door' && cells.length !== 2) {
                return;
            }

            cells.forEach(cell => {
                while (cell.firstChild) {
                    cell.removeChild(cell.firstChild);
                }

                if (type === 'Dice') {
                    const diceValue = cellData?.diceValue || '';

                    const diceCell = document.createElement('div');
                    diceCell.className = 'dice-cell' + (diceValue.length > 2 ? ' small-font' : '');
                    diceCell.textContent = diceValue;
                    cell.appendChild(diceCell);
                }
                else {
                    const furnitureIcon = document.createElement('img');
                    furnitureIcon.src = src;

                    furnitureIcon.style.transformOrigin = '0 0';
                    switch (angle) {
                        case 0:
                            furnitureIcon.style.transform = 'rotate(0deg)';
                            break;
                        case 90:
                            furnitureIcon.style.transform = 'rotate(90deg) translate(0, -100%)';
                            break;
                        case 180:
                            furnitureIcon.style.transform = 'rotate(180deg) translate(-100%, -100%)';
                            break;
                        case 270:
                            furnitureIcon.style.transform = 'rotate(270deg) translate(-100%, 0)';
                            break;
                    }

                    const probe = new Image();
                    probe.src = src;
                    probe.onload = () => {
                        const w = probe.naturalWidth;
                        const h = probe.naturalHeight;
                        const displayW = Math.round(32 * (w / 256));
                        const displayH = Math.round(32 * (h / 256));
                        furnitureIcon.style.width = `${displayW}px`;
                        furnitureIcon.style.height = `${displayH}px`;
                    };

                    cell.appendChild(furnitureIcon);
                    cell.classList.remove('active');
                }

                if (!isLoading) {
                    mapData.cells.push({ x: cell.getAttribute('data-col'), y: cell.getAttribute('data-row'), src: src, angle: angle });
                }
            });
        }

        cells.forEach(deactivateCell);
        console.log(mapData);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyBorders);
    } else {
        applyBorders();
    }
})();