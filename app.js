(function () {
    function create2DArray(N, M, defaultValue = '') {
        let arr = new Array(N);
        for (let i = 0; i < N; i++) {
            if (typeof defaultValue == "object") {
                arr[i] = new Array(M).fill({...defaultValue});
            } else {
                arr[i] = new Array(M).fill(defaultValue)
            }
        }
        return arr;
    }

    function numberToColumnName(num) {
        let columnName = ''
        while(num > 0) {
            let remainder = (num - 1) % 26;
            columnName = String.fromCharCode(65 + remainder) + columnName;
            num = Math.floor((num-1)/26); // 33 -> 7 -> C
        }
        return columnName;
    }

    var textInput;

    const rowCount = 100;
    const colCount = 100;
    let mode = "NORMAL" // NORMAL or SEARCH

    let selectedCell = {
        row: 1, col: 1
    }

    let selectedCellFormula = {
        row: 1, col: 1
    }

    let highlightedCells = []; // cell names like A1, A2

    let selectedCellRange = {
        startRow: selectedCell.row,
        endRow: selectedCell.row,
        startCol: selectedCell.col,
        endCol: selectedCell.col
    }

    let selectedCellFormulaRange = {
        startRow: selectedCell.row,
        endRow: selectedCell.row,
        startCol: selectedCell.col,
        endCol: selectedCell.col
    }


    let spreadsheetData = create2DArray(rowCount, colCount, '');
    let cellProperties = create2DArray(rowCount, colCount, {
        textAlign: "left"
    })

    let formulaInCell = {} // 'A2': '=A1+B1'
    let executionsDependentOnCell = {} // 'A1': ['A3', 'C1']
    
    let canvas;
    let ctx;
    let rowHeights = new Array(rowCount).fill(26);
    let colWidths = new Array(colCount).fill(100);

    for (let row = 0; row < rowCount; row++) {
        for (let col = 0; col < colCount; col++) {
            if (row == 0 && col > 0) {
                spreadsheetData[row][col] = numberToColumnName(col);
                cellProperties[row][col]['textAlign'] = 'center';
            } else if (col == 0 && row > 0) {
                spreadsheetData[row][col] = row.toString();
                cellProperties[row][col]['textAlign'] = 'center';
            }
        }
    }

    var DrawFunctions = (function() {
        function getCellPosition(row, col) {
            let y = 0;
            for (let r = 0; r < row; r++) {
                y += rowHeights[r];
            }
            let x = 0;
            for (let c = 0; c < col; c++) {
                x += colWidths[c];
            }
            return {x, y};
        }

        function drawSingleCell(row, col) {
            const props = cellProperties[row][col];
            const pos = getCellPosition(row, col);
            ctx.strokeStyle = 'rgba(0,0,0,0.2)';
            ctx.lineWidth = 1;
            ctx.setLineDash([]);
            ctx.strokeRect(pos.x, pos.y, colWidths[col], rowHeights[row]);

            const text = spreadsheetData[row][col];
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';

            if ('textAlign' in props) {
                ctx.textAlign = props['textAlign'];
            }
            
            const paddingX = 5;
            var textX;
            switch(ctx.textAlign) {
                case 'left':
                    textX = pos.x + paddingX;
                    break;
                case "right":
                    textX = pos.x + colWidths[col] - paddingX;
                    break;
                case "center":
                    textX = pos.x + colWidths[col] / 2;
                    break;
            }

            const textY = pos.y + rowHeights[row] / 2;

            ctx.fillText(text, textX, textY);
        }

        function highlightCell(cellName) {
            const c = convertCellNameToRowCol(cellName)
            const pos = getCellPosition(c.row, c.col);
            ctx.strokeStyle = "red";
            ctx.lineWidth = 3;
            ctx.setLineDash([2, 2]);
            ctx.strokeRect(pos.x, pos.y, colWidths[c.col], rowHeights[c.row]);
        }

        function drawHighlightedCells() {
            for (let c of highlightedCells) {
                highlightCell(c)
            }
        }

        function drawCells() {
            for (let row = 0; row < rowCount; row++) {
                for (let col = 0; col < colCount; col++) {
                    drawSingleCell(row, col)
                }
            }
        }

        function drawSelectedCellBorder() {
            const pos = getCellPosition(selectedCell.row, selectedCell.col);
            const borderDiv = document.getElementById("selectedCellBorder");
            borderDiv.style.display = "block";
            borderDiv.style.left = `${pos.x + 1}px`;
            borderDiv.style.top = `${pos.y + 1}px`;
            borderDiv.style.width = `${colWidths[selectedCell.col] - 1}px`;
            borderDiv.style.height = `${rowHeights[selectedCell.row] - 1}px`;
            borderDiv.style.border = "3px solid blue";
        }

        function drawSelectedCellRange() {
            const selectedRangeDiv = document.getElementById("selectedRange");
            selectedRangeDiv.style.display = "absolute";
            // x , y, width, height
            let rangeStartCol = Math.min(selectedCellRange.endCol,selectedCellRange.startCol);
            let rangeStartRow = Math.min(selectedCellRange.endRow,selectedCellRange.startRow);

            const pos = getCellPosition(rangeStartRow, rangeStartCol);

            selectedRangeDiv.style.left = `${pos.x + 1}px`;
            selectedRangeDiv.style.top = `${pos.y + 1}px`;

            let rangeWidth = 0;
            let rangeHeight = 0;
            let startRow = Math.min(selectedCellRange.startRow, selectedCellRange.endRow);
            let endRow = Math.max(selectedCellRange.startRow, selectedCellRange.endRow);
            for (let r = startRow; r <= endRow; r++) {
                rangeHeight += rowHeights[r];
            }

            let startCol = Math.min(selectedCellRange.startCol, selectedCellRange.endCol);
            let endCol = Math.max(selectedCellRange.startCol, selectedCellRange.endCol);
            for (let c = startCol; c <= endCol; c++) {
                rangeWidth += colWidths[c];
            }

            selectedRangeDiv.style.width = `${rangeWidth}px`;
            selectedRangeDiv.style.height = `${rangeHeight}px`;

            if (selectedCellRange.startRow != selectedCellRange.endRow || selectedCellRange.startCol != selectedCellRange.endCol) {
                selectedRangeDiv.style.border = "1px solid rgba(0,0,255,0.8)";
                selectedRangeDiv.style.background = "rgba(0,0,255, 0.5)";
            } else {
                selectedRangeDiv.style.background = "rgba(0,0,255, 0)";
                selectedRangeDiv.style.border = "1px solid rgba(0,0,255,0)";
            }

        }

        function drawGrid() {
            ctx.clearRect(0,0,canvas.width, canvas.height);
            ctx.strokeStyle = 'rgba(0,0,0,0.2)';
            drawCells();
            drawSelectedCellBorder();
            drawSelectedCellRange();
            drawHighlightedCells();
        }
        return {drawGrid, getCellPosition};
    })()


    function clickOnCell(event) {

    }


    document.addEventListener("DOMContentLoaded", function() {
        canvas = document.getElementById("spreadsheet");
        textInput = document.getElementById("textInput");
        ctx = canvas.getContext("2d");
        const canvasWidth = 1200;
        const canvasHeight = 1700;
        const ratio = window.devicePixelRatio;
        canvas.width = canvasWidth * ratio;
        canvas.height = canvasHeight * ratio;
        canvas.style.width = canvasWidth + "px";
        canvas.style.height = canvasHeight + "px";

        canvas.addEventListener('click', function(event) {
            const rect = canvas.getBoundingClientRect()
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            let totalHeightChecked  = 0
            let r = 0
            for (let h of rowHeights) {
                totalHeightChecked += h
                if (y < totalHeightChecked) {
                    break
                }
                r += 1
            }

            let totalWidthChecked  = 0
            let c = 0
            for (let w of colWidths) {
                totalWidthChecked += w
                if (x < totalWidthChecked) {
                    break
                }
                c += 1
            }
            console.log(r, c)

            selectedCell = {col: c, row: r}
            selectedCellRange = {
                startRow: r,
                startCol: c,
                endRow: r,
                endCol: c
            }
            DrawFunctions.drawGrid()
        })
        
        ctx.scale(ratio, ratio);
        
        DrawFunctions.drawGrid()
    })

    function canCellBeShifted(r, c, key) {
        if (key == "ArrowLeft") {
            return c > 1
        }
        if (key == "ArrowRight") {
            return c < colCount - 1;
        }
        if (key == "ArrowUp") {
            return r > 1;
        }
        if (key == "ArrowDown") {
            return r < rowCount - 1;
        }
    }

    function canSelectedCellFormulaBeShifted(key) {
        const r = selectedCellFormula.row;
        const c = selectedCellFormula.col;
        return canCellBeShifted(r, c, key)
    }

    function canSelectedCellBeShifted(key) {
        const r = selectedCell.row;
        const c = selectedCell.col;
        return canCellBeShifted(r, c, key)
    }

    function resetSelectedCellRange() {
        selectedCellRange.startRow = selectedCell.row;
        selectedCellRange.endRow = selectedCell.row;
        selectedCellRange.startCol = selectedCell.col;
        selectedCellRange.endCol = selectedCell.col;
    }

    function isFormula(v) {
        return v.startsWith('=')
    }

    function convertCellNameToRowCol(cellName) {
        cellName = cellName.replace(/\$/g, ''); // support for absolute references
        let columnLetters = cellName.match(/[A-Z]+/)[0]
        let rowNum = parseInt(cellName.match(/\d+/)[0], 10)
        let colNum = 0;
        for (let i = 0; i < columnLetters.length; i++) {
            colNum = colNum * 26 + (columnLetters.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
        }
        return {
            row: rowNum,
            col: colNum
        }
    }

    function convertRowColToCellName(row, col) {
        return numberToColumnName(col) + row.toString()
    }

    function run_avg_func(paramString, outputCellName) {
        const s = run_sum_func(paramString, outputCellName)
        if (isFinite(s)) {
            const cellRange = paramString
            const cellNameRegex = /[A-Z]+\d+/g
            const cellNames = cellRange.match(cellNameRegex)
            if (cellNames.length != 2) return "#NaN"
            const c1 = convertCellNameToRowCol(cellNames[0])
            const c2 = convertCellNameToRowCol(cellNames[1])
            let numCells = (Math.abs(c1.row - c2.row) + 1) * (Math.abs(c1.col - c2.col) + 1)
            return s/numCells
        }
        return '#NaN'
    }

    function run_sum_func(paramString, outputCellName) {
        const cellRange = paramString
        const cellNameRegex = /[A-Z]+\d+/g
        const cellNames = cellRange.match(cellNameRegex)
        if (cellNames.length != 2) return "#NaN"
        let s = 0;
        const c1 = convertCellNameToRowCol(cellNames[0])
        const c2 = convertCellNameToRowCol(cellNames[1])

        for (let r = Math.min(c1.row, c2.row); r <= Math.max(c1.row, c2.row); r++) {
            for (let c=Math.min(c1.col, c2.col); c <= Math.max(c1.col, c2.col); c++) {
                // add dependency
                const cName = convertRowColToCellName(r, c)
                if (!(cName in executionsDependentOnCell)) {
                    executionsDependentOnCell[cName] = []
                }
                if (!(executionsDependentOnCell[cName].includes(outputCellName))) {
                    executionsDependentOnCell[cName].push(outputCellName);
                }

                const v = spreadsheetData[r][c]
                if (isFinite(v)) {
                    s += parseFloat(v)
                } else {
                    return '#NaN'
                }
            }
        }
        return s;
    }

    function run_min_max_func(paramString, outputCellName) {
        const cellRange = paramString
        const cellNameRegex = /[A-Z]+\d+/g
        const cellNames = cellRange.match(cellNameRegex)
        if (cellNames.length != 2) return "#NaN"
        
        let minVal = 10000
        let maxVal = -10000

        const c1 = convertCellNameToRowCol(cellNames[0])
        const c2 = convertCellNameToRowCol(cellNames[1])

        for (let r = Math.min(c1.row, c2.row); r <= Math.max(c1.row, c2.row); r++) {
            for (let c=Math.min(c1.col, c2.col); c <= Math.max(c1.col, c2.col); c++) {
                // add dependency
                const cName = convertRowColToCellName(r, c)
                if (!(cName in executionsDependentOnCell)) {
                    executionsDependentOnCell[cName] = []
                }
                if (!(executionsDependentOnCell[cName].includes(outputCellName))) {
                    executionsDependentOnCell[cName].push(outputCellName);
                }

                const v = spreadsheetData[r][c]
                if (isFinite(v)) {
                    const vAsFloat = parseFloat(v)
                    minVal = Math.min(vAsFloat, minVal)
                    maxVal = Math.max(vAsFloat, maxVal)
                } else {
                    return '#NaN'
                }
            }
        }
        return {minVal, maxVal};
    }

    function run_min_func(paramString, outputCellName) {
        const result = run_min_max_func(paramString, outputCellName)
        if (typeof(result) == 'object') {
            return result.minVal
        }
        return result;
    }

    function run_max_func(paramString, outputCellName) {
        const result = run_min_max_func(paramString, outputCellName)
        if (typeof(result) == 'object') {
            return result.maxVal;
        }
        return result;
    }

    // Additional Data Quality Functions
    function run_trim_func(paramString, outputCellName) {
        const cellNameRegex = /[A-Z]+\d+/g;
        const cellNames = paramString.match(cellNameRegex);
        if (cellNames && cellNames.length > 0) {
            const cellName = cellNames[0];
            const c = convertCellNameToRowCol(cellName);
            let val = spreadsheetData[c.row][c.col];
            return (typeof val === 'string') ? val.trim() : val;
        }
        return '#NaN';
    }

    function run_count_func(paramString, outputCellName) {
        const cellRange = paramString;
        const cellNameRegex = /[A-Z]+\\d+/g;
        const cellNames = cellRange.match(cellNameRegex);
        if (!cellNames || cellNames.length !== 2) {
            return '#NaN';
        }
        const c1 = convertCellNameToRowCol(cellNames[0]);
        const c2 = convertCellNameToRowCol(cellNames[1]);
    
        let count = 0;
        for (let r = Math.min(c1.row, c2.row); r <= Math.max(c1.row, c2.row); r++) {
            for (let c = Math.min(c1.col, c2.col); c <= Math.max(c1.col, c2.col); c++) {
                const cName = convertRowColToCellName(r, c);
                if (!(cName in executionsDependentOnCell)) {
                    executionsDependentOnCell[cName] = [];
                }
                if (!executionsDependentOnCell[cName].includes(outputCellName)) {
                    executionsDependentOnCell[cName].push(outputCellName);
                }
                const val = spreadsheetData[r][c];
                if (val !== '' && !isNaN(val)) {
                    count++;
                }
            }
        }
        return count;
    }

    function run_upper_func(paramString, outputCellName) {
        const cellNameRegex = /[A-Z]+\d+/g;
        const cellNames = paramString.match(cellNameRegex);
        if (cellNames && cellNames.length > 0) {
            const cellName = cellNames[0];
            const c = convertCellNameToRowCol(cellName);
            let val = spreadsheetData[c.row][c.col];
            return (typeof val === 'string') ? val.toUpperCase() : val;
        }
        return '#NaN';
    }

    function run_lower_func(paramString, outputCellName) {
        const cellNameRegex = /[A-Z]+\d+/g;
        const cellNames = paramString.match(cellNameRegex);
        if (cellNames && cellNames.length > 0) {
            const cellName = cellNames[0];
            const c = convertCellNameToRowCol(cellName);
            let val = spreadsheetData[c.row][c.col];
            return (typeof val === 'string') ? val.toLowerCase() : val;
        }
        return '#NaN';
    }

    function run_remove_duplicates_func(paramString, outputCellName) {
        const cellsList = listCellsInRange(paramString);
        const values = cellsList.map(cellName => {
            const c = convertRowColToCellName(...Object.values(convertCellNameToRowCol(cellName)));
            const rc = convertCellNameToRowCol(cellName);
            return spreadsheetData[rc.row][rc.col];
        });
        const uniqueValues = [...new Set(values)];
        return uniqueValues.join(', ');
    }

    function run_find_and_replace_func(paramString, outputCellName) {
        // Expect paramString: "range,find,replace"
        const parts = paramString.split(',');
        if(parts.length !== 3) return '#NaN';
        const rangeStr = parts[0];
        const findStr = parts[1];
        const replaceStr = parts[2];
        const cellsList = listCellsInRange(rangeStr);
        if(cellsList.length > 0){
            const cellName = cellsList[0];
            const c = convertCellNameToRowCol(cellName);
            let val = spreadsheetData[c.row][c.col];
            if(typeof val === 'string'){
                return val.split(findStr).join(replaceStr);
            }
        }
        return '#NaN';
    }

    const funcList = ["SUM", "AVERAGE", "MIN", "MAX", "TRIM", "UPPER", "LOWER", "REMOVE_DUPLICATES", "FIND_AND_REPLACE"];

    const funcMap = {
        "SUM": run_sum_func,
        "AVERAGE": run_avg_func,
        "MIN": run_min_func,
        "MAX": run_max_func,
        "TRIM": run_trim_func,
        "UPPER": run_upper_func,
        "LOWER": run_lower_func,
        "REMOVE_DUPLICATES": run_remove_duplicates_func,
        "FIND_AND_REPLACE": run_find_and_replace_func
    }

    function isFunctionPresent(expr) {
        
        for (let f of funcList) {
            if (expr.includes(`${f}(`)) {
                return true
            }
        }
        return false;
    }

    function executeFunctionExpr(expr, outputCellName) {
        // A1:C3 extraction
        let extract = false
        let extractFunc = false;
        let params = ''
        let funcName = ''
        for (let ch of expr) {
            if (ch == '=') {
                extractFunc = true
                continue
            }
            if (ch == '(') {
                if (extractFunc) {
                    extractFunc = false
                }
                extract = true;
                continue;
            }
            if (ch == ')' && extract) {
                extract = false;
                break;
            }
            if (extract) {
                params += ch
                continue
            }
            if (extractFunc) {
                funcName += ch
                continue
            }
        }
        if (funcName in funcMap) {
            return funcMap[funcName](paramString=params, outputCellName=outputCellName)
        }
        return '#NaN'
    }

    function execute(expr, outputCellName) {
        // =A1+A2 --> A1, A2 --> =1+2 --> math.js evaluate function
        if (isFunctionPresent(expr)) {
            return executeFunctionExpr(expr, outputCellName)
        }
        expr = expr.replaceAll('=', '')
        const cellNameRegex = /[A-Z]+\d+/g

        const exprWithVals = expr.replace(
            cellNameRegex,
            (match) => {
                // get the value in this cell A3 -> 3,1
                const rowcol = convertCellNameToRowCol(match);

                if (!(match in executionsDependentOnCell)) {
                    executionsDependentOnCell[match] = []
                }
                if (!(executionsDependentOnCell[match].includes(outputCellName))) {
                    executionsDependentOnCell[match].push(outputCellName);
                }
                return spreadsheetData[rowcol.row][rowcol.col]
            }
        )

        try {
            return math.evaluate(exprWithVals)
        } catch (error) {
            console.error(`error evaluating ${exprWithVals}`, error)
            return '#NaN'
        }
    }

    function recalculateDependents(selectedCellName) {
        if (selectedCellName in executionsDependentOnCell) {
            for (let i = 0; i < executionsDependentOnCell[selectedCellName].length; i++) {
                const cellNameToBeExecuted = executionsDependentOnCell[selectedCellName][i];
                const cellToBeExecuted = convertCellNameToRowCol(cellNameToBeExecuted);
                const expr = formulaInCell[cellNameToBeExecuted];
                console.log(expr)
                const result = execute(expr, cellNameToBeExecuted);
                spreadsheetData[cellToBeExecuted.row][cellToBeExecuted.col] = result;
                updateCellValue(cellNameToBeExecuted, result)
            }
        }
    }
    
    function checkCycle(cellName, startCellName, visited=[]) {
        if (cellName == startCellName && visited.length > 0) return true;
        if (visited.includes(cellName)) return false;

        visited.push(cellName);
        
        if (cellName in executionsDependentOnCell) {
            const depens = executionsDependentOnCell[cellName];

            for (let c of depens) {
                if (checkCycle(c, startCellName, visited)) {
                    return true
                }
            }
            return false
        }
    }

    function updateCellValue(cellName, value) {
        // check if there's a cycle
        if (checkCycle(cellName, cellName)) {
            alert('circular reference found.');
            return;
        }
        const rowcol = convertCellNameToRowCol(cellName);
        spreadsheetData[rowcol.row][rowcol.col] = value;
        recalculateDependents(cellName)
    }

    function resetTextInput() {
        if (textInput.style.display == "block") {
            textInput.style.display = "none";
            const inputVal = textInput.innerHTML;
            const selectedCellName = convertRowColToCellName(selectedCell.row, selectedCell.col);
            
            if (isFormula(inputVal)) {
                const result = execute(inputVal, selectedCellName);
                formulaInCell[selectedCellName] = inputVal
                updateCellValue(selectedCellName, result)
    
            } else {
                updateCellValue(selectedCellName, inputVal)
            }

            // textInput.innerHTML = '';
            updateTextInput('', focus=false)
            textInput.blur();
        }
    }

    function resetSelectedCellFormula() {
        selectedCellFormula.row = selectedCell.row
        selectedCellFormula.col = selectedCell.col
    }

    function handleNormalArrowKeys(key) {
        if (canSelectedCellBeShifted(key)) {
            resetTextInput()
            switch(key) {
                case "ArrowLeft":
                    selectedCell.col -= 1;
                    break;
                case "ArrowRight":
                    selectedCell.col += 1;
                    break;
                case "ArrowUp":
                    selectedCell.row -= 1;
                    break;
                case "ArrowDown":
                    selectedCell.row += 1;
                    break
            }
            // reset here
            resetSelectedCellRange()
            resetSelectedCellFormula()
        }
    }

    function updateTextInput(value, focus) {
        textInput.innerHTML = value
        console.log('updating text input')
        if (focus) {
            // move cursor to the end
            console.log('moving cursor to end')
            const selection = window.getSelection();
            const range = document.createRange();
            selection.removeAllRanges();
            range.selectNodeContents(textInput);
            range.collapse(false);
            selection.addRange(range);
            textInput.focus();
        }

        // on change things
        // change highlightedCells
        findCellNamesAndHighlight(textInput.innerHTML)
    }

    function updateCellAtTheEndOfTextInput() {
        // if the contents end with a cell name, replace that cell name with the selectedCellFormula cell name
        // else add the selectedCellFormula name at the end of the contents
        const cellNameRegex = /[A-Z]+\d+/g
        const cellNames = textInput.innerHTML.match(cellNameRegex)
        if (cellNames != null && cellNames.length > 0) {
            const lastCellName = cellNames.slice(-1)[0]
            if (textInput.innerHTML.endsWith(lastCellName)) {
                // replace the last cellName 
                let val = textInput.innerHTML.slice(0, textInput.innerHTML.length - lastCellName.length)
                val += convertRowColToCellName(selectedCellFormula.row, selectedCellFormula.col)
                // textInput.innerHTML = val
                updateTextInput(val, focus=true)
            } else {
                // textInput.innerHTML += convertRowColToCellName(selectedCellFormula.row, selectedCellFormula.col)
                const val = textInput.innerHTML + convertRowColToCellName(selectedCellFormula.row, selectedCellFormula.col)
                updateTextInput(val, focus=true)
            }
        } else {
            textInput.innerHTML += convertRowColToCellName(selectedCellFormula.row, selectedCellFormula.col)
        }

        
    }

    function handleFormulaArrowKeys(key) {
        if (canSelectedCellFormulaBeShifted(key)) {
            switch(key) {
                case "ArrowLeft":
                    selectedCellFormula.col -= 1;
                    break;
                case "ArrowRight":
                    selectedCellFormula.col += 1;
                    break;
                case "ArrowUp":
                    selectedCellFormula.row -= 1;
                    break;
                case "ArrowDown":
                    selectedCellFormula.row += 1;
                    break
            }
            // update the contents of the text input field
            updateCellAtTheEndOfTextInput()
        }
    }

    function checkIfInFormula(inputSoFar) {
        const lastChar = inputSoFar.slice(-1)
        const code = lastChar.charCodeAt(0);
        if (!(code > 47 && code < 58) && // numeric (0-9)
            !(code > 64 && code < 91) && // upper alpha (A-Z)
            !(code > 96 && code < 123)) { // lower alpha (a-z)
            return true
        } else {
            return false
        }
    }

    function handleArrowKeys(key) {
        if (mode == "SEARCHING") {
            handleFormulaArrowKeys(key)
        }
        else if (mode == "NORMAL") {
            handleNormalArrowKeys(key)
        }
        DrawFunctions.drawGrid();
    }

    function canSelectedRangeBeExpanded(key) {
        switch (key) {
            case "ArrowLeft":
                return selectedCellRange.endCol > 1;
                break;
            case "ArrowRight":
                return selectedCellRange.endCol < colCount - 1;
                break;
            case "ArrowUp":
                return selectedCellRange.endRow > 1;
                break;
            case "ArrowDown":
                return selectedCellRange.endRow < rowCount - 1;
                break;
        }
    }

    function handleNormalShiftArrowKeys(key) {
        // checks if the range can be expanded in the diretcion of the key
        if (canSelectedRangeBeExpanded(key)) {
            switch(key) {
                case "ArrowLeft":
                    selectedCellRange.endCol -= 1;
                    break;
                case "ArrowRight":
                    selectedCellRange.endCol += 1;
                    break;
                case "ArrowUp":
                    selectedCellRange.endRow -= 1;
                    break;
                case "ArrowDown":
                    selectedCellRange.endRow += 1;
                    break;
            }
            console.log(selectedCellRange)
        }
    }

    function handleShiftArrowKeys(key) {
        if (mode == "NORMAL") {
            handleNormalShiftArrowKeys(key)
        }
        DrawFunctions.drawGrid();
    }

    function displayInput() {
        const pos = DrawFunctions.getCellPosition(selectedCell.row, selectedCell.col);
        textInput.style.display = "block";
        textInput.style.left = `${pos.x + 1}px`;
        textInput.style.top = `${pos.y + 1}px`;
        textInput.style.minWidth = `${colWidths[selectedCell.col] - 1}px`;
        textInput.style.height = `${rowHeights[selectedCell.row] - 1}px`;
        textInput.style.padding = '5px';
        textInput.style.background = "#fff";
        textInput.style.textBaseline = "center";
        textInput.style.outline = "4px solid rgba(0,0,255,0.8)";
        // textInput.innerHTML = spreadsheetData[selectedCell.row][selectedCell.col];
        // textInput.focus();
        updateTextInput(spreadsheetData[selectedCell.row][selectedCell.col], focus=true)
    }

    function handleEnterKey() {
        if (textInput.style.display == "none" || textInput.style.display == "") {
            displayInput();
        } else if (textInput.style.display == "block") {
            mode = "NORMAL"
            highlightedCells = []
            handleArrowKeys('ArrowDown')
        }
    }

    function deleteCellContents(row, col) {
        spreadsheetData[row][col] = ""
        const selectedCellName = convertRowColToCellName(row, col)
        if (selectedCellName in formulaInCell) {
            delete formulaInCell[selectedCellName]
            for (const [k, v] of Object.entries(executionsDependentOnCell)) {
                if (v.includes(selectedCellName)) {
                    const newV = v.filter(function(item) {
                        return item !== selectedCellName
                    })
                    executionsDependentOnCell[k] = newV
                }   
            }
        }
    }

    function handleDeleteKey() {
        deleteCellContents(selectedCell.row, selectedCell.col)
        // delete the selected cell range
        if (selectedCellRange.startRow != selectedCellRange.endRow || selectedCellRange.startCol != selectedCellRange.endCol) {
            for (let r = Math.min(selectedCellRange.startRow, selectedCellRange.endRow); r <= Math.max(selectedCellRange.startRow, selectedCellRange.endRow); r++) {
                for (let c=Math.min(selectedCellRange.startCol, selectedCellRange.endCol); c <= Math.max(selectedCellRange.startCol, selectedCellRange.endCol); c++) {
                    deleteCellContents(r, c)
                }
            }
        }
        console.log(formulaInCell, executionsDependentOnCell)
        DrawFunctions.drawGrid()
    }

    function listCellsInRange(cellRange) {
        // e.g. cellRange: A1:C3
        const cellNameRegex = /[A-Z]+\d+/g
        const cellNames = cellRange.match(cellNameRegex)
        if (cellNames.length != 2) return "#NaN"
        const c1 = convertCellNameToRowCol(cellNames[0])
        const c2 = convertCellNameToRowCol(cellNames[1])

        let cellsList = []

        for (let r = Math.min(c1.row, c2.row); r <= Math.max(c1.row, c2.row); r++) {
            for (let c=Math.min(c1.col, c2.col); c <= Math.max(c1.col, c2.col); c++) {
                // add dependency
                const cName = convertRowColToCellName(r, c)
                cellsList.push(cName)
            }
        }
        return cellsList
    }

    function findCellNamesAndHighlight(expr) {
        const cellNameRegex = /[A-Z]+\d+/g
        const cellNames = expr.match(cellNameRegex)
        
        const cellRangeRegex = /[A-Z]+\d+:[A-Z]+\d+/g
        const cellRanges = expr.match(cellRangeRegex)

        if (cellRanges != null && cellRanges.length > 0) {
            for (let cellRange of cellRanges) {
                let cellsList = listCellsInRange(cellRange)
                cellNames.push(...cellsList)
            }
        }

        console.log('cellNames', cellNames)
        if (cellNames != null && cellNames.length > 0) {
            highlightedCells = cellNames
        }
    }

    document.addEventListener("keydown", function(event) {
        let key = event.key;
        if (event.shiftKey && ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"].includes(key)) {
            event.preventDefault()    
            handleShiftArrowKeys(key);
        } else if (["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"].includes(key)) {
            event.preventDefault()
            handleArrowKeys(key);
        } else if (key == "Enter") {
            event.preventDefault();
            handleEnterKey();
        } else if (key.length == 1) {
            if (textInput.style.display == "none" || textInput.style.display == "") {
                displayInput();
            }
            // change modes
            const expr = textInput.innerHTML + key;
            console.log('expr', expr)
            if (isFormula(expr)) {
                findCellNamesAndHighlight(expr)
                DrawFunctions.drawGrid()
            }
            const isInFormula = checkIfInFormula(expr)
            if (isInFormula) {
                mode = "SEARCHING"
                resetSelectedCellFormula()
            }
        } else if (key == "Backspace") {
            if (textInput.style.display == "none" || textInput.style.display == "") {
                event.preventDefault()
                handleDeleteKey()
            }
        }
        console.log("Key pressed: ", key)
    })
    
    /**
     * mode = NORMAL, TYPING, SEARCHING
     * textInput.innerHTML.slice(-1) = '='/'+'/.... > SEARCHING
     * press enter or move out of the cell > NORMAL
     */

    // --- Additional Enhancements Below ---

    // Support for additional mathematical and data quality functions has been added above
    // in the funcList and funcMap along with functions:
    // run_trim_func, run_upper_func, run_lower_func, run_remove_duplicates_func, run_find_and_replace_func

    // Support for relative and absolute references is enabled in convertCellNameToRowCol

    // Saving and Loading the spreadsheet
    function saveSpreadsheet() {
        const dataToSave = {
            spreadsheetData,
            cellProperties,
            formulaInCell,
            executionsDependentOnCell,
            rowHeights,
            colWidths
        };
        localStorage.setItem('spreadsheetData', JSON.stringify(dataToSave));
        alert('Spreadsheet saved!');
    }

    function loadSpreadsheet() {
        const savedData = localStorage.getItem('spreadsheetData');
        if (savedData) {
            const parsed = JSON.parse(savedData);
            spreadsheetData = parsed.spreadsheetData;
            cellProperties = parsed.cellProperties;
            formulaInCell = parsed.formulaInCell;
            executionsDependentOnCell = parsed.executionsDependentOnCell;
            rowHeights = parsed.rowHeights;
            colWidths = parsed.colWidths;
            DrawFunctions.drawGrid();
            alert('Spreadsheet loaded!');
        } else {
            alert('No saved spreadsheet found.');
        }
    }

    // Data Visualization: Generate a simple bar chart based on column sums
    function generateChart() {
        const chartCanvas = document.createElement('canvas');
        chartCanvas.width = 600;
        chartCanvas.height = 400;
        document.body.appendChild(chartCanvas);
        const chartCtx = chartCanvas.getContext('2d');
        
        let sums = [];
        for (let c = 1; c < colCount; c++) { // skip header column
            let sum = 0;
            for (let r = 1; r < rowCount; r++) { // skip header row
                const val = spreadsheetData[r][c];
                if (!isNaN(val) && val !== '') {
                    sum += parseFloat(val);
                }
            }
            sums.push(sum);
        }
        
        const barWidth = 40;
        const gap = 10;
        chartCtx.fillStyle = 'blue';
        for (let i = 0; i < sums.length; i++) {
            const barHeight = sums[i];
            chartCtx.fillRect(i * (barWidth + gap), chartCanvas.height - barHeight, barWidth, barHeight);
        }
    }

    // Expose save, load, and chart functions to the global scope for testing
    window.saveSpreadsheet = saveSpreadsheet;
    window.loadSpreadsheet = loadSpreadsheet;
    window.generateChart = generateChart;
})();
/****************************************************
 * 
 *         YOUR ORIGINAL MASSIVE CODE HERE
 *         (unchanged, no lines removed)
 * 
 ****************************************************/


// --- New Functions ---

/**
 * Inserts a template function call into the formula input.
 * Example: insertFunction('SUM') => formulaInput.value = '=SUM(A1:B1)'
 * Then user can tweak the cell range.
 */
function insertFunction(fnName) {
    const formulaBar = document.getElementById("formula-input");
    // Basic example: you might want to dynamically pick a default range.
    // Here, we'll just use (A1:B1) as a placeholder.
    let placeholderRange = "(A1:B1)";
  
    // For FIND_AND_REPLACE, we might do something like (A1:B1,FindMe,ReplaceMe).
    if (fnName === 'FIND_AND_REPLACE') {
      placeholderRange = "(A1:B1,FindMe,ReplaceMe)";
    }
    else if (fnName === 'REMOVE_DUPLICATES') {
      placeholderRange = "(A1:B5)"; 
    }
  
    formulaBar.value = `=${fnName}${placeholderRange}`;
    formulaBar.focus();
  }
  
  /**
   * Example function for data entry & validation category
   * (In real usage, you'd loop over your cells, check if they're numeric, etc.)
   */
  function validateNumericCells() {
    alert("Validating numeric cells... (Placeholder function)");
    // Implement your numeric validation logic here.
  }
  
  /****************************************************
 * 
 *  ... your original massive code remains untouched ...
 * 
 ****************************************************/

// --- Add these lines at the very end ---

/**
 * Auto-resize the column if text exceeds the current col width.
 */
function autoResizeColumn(row, col) {
    // Use the same font settings as in your drawSingleCell() 
    ctx.save();
    ctx.font = "12px sans-serif"; // or whatever font you use
    const text = spreadsheetData[row][col];
    // Add some padding so text isn’t flush against cell border
    const measuredWidth = ctx.measureText(String(text)).width + 10; 
    ctx.restore();

    // Update column width if needed
    if (measuredWidth > colWidths[col]) {
        colWidths[col] = measuredWidth;
    }
}

/**
 * Overwrite your existing updateCellValue or just modify it to call autoResizeColumn
 * whenever a cell changes. 
 * 
 * If your updateCellValue() already exists, add the marked line below:
 */
const originalUpdateCellValue = updateCellValue;  // keep a reference to your original

updateCellValue = function(cellName, value) {
    // Call the original logic first
    originalUpdateCellValue(cellName, value);

    // Then auto-resize the column
    const { row, col } = convertCellNameToRowCol(cellName);
    autoResizeColumn(row, col);

    // Finally, redraw to see the new widths
    DrawFunctions.drawGrid();
};
