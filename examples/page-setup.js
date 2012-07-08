(function() {

    var btn = document.getElementById("btnTest"),
        tcList = document.getElementById("testCaseList"),
        inputTextArea = document.getElementById("inputCode"),
        errMsgs = document.getElementById("errMsgs"),
        cbRmMisTags = document.getElementById("cbRmMisTags"),
        cbAddLb = document.getElementById("cbAddLb");
    
    // For IE
    if (!btn.addEventListener) {
        btn.addEventListener = function(method, funct, evtCap) {
            btn.attachEvent("on" + method, funct);
        };
        tcList.addEventListener = function(method, funct, evtCap) {
            tcList.attachEvent("on" + method, funct);
        };
        cbRmMisTags.addEventListener = function(method, funct, evtCap) {
            cbRmMisTags.attachEvent("on" + method, funct);
        };
        cbAddLb.addEventListener = function(method, funct, evtCap) {
            cbAddLb.attachEvent("on" + method, funct);
        };
    }


    /*
        What happens when a user selects a new element in the Test Case list
    */
    var testCaseCode = [];
    testCaseCode[""] = "";
    testCaseCode["Nested Color Tags"] = 
"[color=red]This text is red\n\
[color=blue]This text is blue[/color]\n\
[color=#00ff00][b]This text is green and [i]bold[/i].[/b] [color=00ffff]Another color change...[/color] green again.[/color]\n\
This text is red[/color]\n\
[b][color=yellow]This text is yellow.[/color][/b]\n\
[color=gray]This text is gray.[/color]\n\
";
    testCaseCode["Color Faded Text"] = "[color=#FF0000]T[/color][color=#F3000C]h[/color][color=#E80017]i[/color][color=#DC0023]s[/color][color=#D1002E] [/color] [color=#C5003A]t[/color][color=#B90046]e[/color][color=#AE0051]x[/color][color=#A2005D]t[/color][color=#970068] [/color] [color=#8B0074]c[/color][color=#7F0080]h[/color][color=#74008B]a[/color][color=#680097]n[/color][color=#5D00A2]g[/color][color=#5100AE]e[/color][color=#4600B9]s[/color][color=#3A00C5] [/color] [color=#2E00D1]i[/color][color=#2300DC]n[/color][color=#1700E8] [/color] [color=#0C00F3]c[/color][color=#0000FF]o[/color][color=#000CF3]l[/color][color=#0017E8]o[/color][color=#0023DC]r[/color][color=#002ED1] [/color] [color=#003AC5]a[/color][color=#0046B9]s[/color][color=#0051AE] [/color] [color=#005DA2]i[/color][color=#006897]t[/color][color=#00748B] [/color] [color=#00807F]g[/color][color=#008B74]o[/color][color=#009768]e[/color][color=#00A25D]s[/color][color=#00AE51] [/color] [color=#00B946]a[/color][color=#00C53A]l[/color][color=#00D12E]o[/color][color=#00DC23]n[/color][color=#00E817]g[/color][color=#00F30C].[/color][color=#00FF00].[/color]";
    testCaseCode["Nested List Tags"] =
"[list]\n\
[*] Item 1\n\
[*] Item 2\n\
[*] Lets display a sub-list:\n\
    [list]\n\
    [*] Another Sub List:\n\
        [list]\n\
        [*] [color=red]This text is red.[/color]\n\
        [*] [color=blue]This sub-list is blue\n\
            [list]\n\
            [*] Blue list item.\n\
            [*] [color=green]Except this item, it's green![/color]\n\
            [/list]\n\
            [/color]\n\
        [/list]\n\
    [*] List item\n\
    [*] Sub-list:\n\
        [list]\n\
        [*] Only one item in this list...\n\
        [/list]\n\
    [/list]\n\
[*] Last item in list\n\
[/list]\n\
[b]And now onto another list[/b]\n\
[list]\n\
[*] Another list here.\n\
[*] This is just a simple list.\n\
[*] It has three items.\n\
[/list]\n\
One last list to try things out on\n\
[list]\n\
[*] 1\n\
    [list]\n\
    [*] 1.1\n\
        [list]\n\
        [*] 1.1.1\n\
        [*] 1.1.2\n\
        [*] 1.1.3\n\
        [/list]\n\
    [*] 1.2\n\
    [/list]\n\
[*] 2\n\
    [list]\n\
    [*] 2.1\n\
    [*] 2.2\n\
    [/list]\n\
[*] 3\n\
    [list]\n\
    [*] 3.1\n\
    [*] 3.2\n\
    [/list]\n\
[/list]";
    testCaseCode["Nested Table Tags"] = 
"[table]\n\
[tr]\n\
[td]cell 1,1[/td]\n\
[td]cell 1,2[/td]\n\
[td]cell 1,3 - here's a sub-table\n\
    [table]\n\
    [tr]\n\
    [td]cell 1,1[/td]\n\
    [td]cell 1,2[/td]\n\
    [td]cell 1,3[/td]\n\
    [/tr]\n\
    [tr]\n\
    [td]cell 2,1[/td]\n\
    [td]cell 2,2[/td]\n\
    [td]cell 2,3[/td]\n\
    [/tr]\n\
    [/table]\n\
[/td]\n\
[/tr]\n\
[tr]\n\
[td]cell 2,1[/td]\n\
[td]cell 2,2[/td]\n\
[td]cell 2,3[/td]\n\
[/tr]\n\
[/table]";
    testCaseCode["Misaligned Tags 1"] = "[b][u]Text with misaligned tags[/b][/u]";
    testCaseCode["Misaligned Tags 2"] = "[color=red]Text with misaligned tags[/color][/color]";
    testCaseCode["Mismatched Parent-Child Tags"] =
"[list]\n\
[b]Not a list item[/b]\n\
[*]A list item\n\
[/list]\n\
\n\
[*]What's this?\n\
[td]What's this?[/td]\n\
\n\
[table]\n\
[color=blue]This should be in a cell[/color]\n\
[tr]\n\
[s]test![/s]\n\
[td]cell\n\
[tr]\n\
What's this?\n\
[/tr]\n\
[/td]\n\
[/tr]\n\
[/table]";
    testCaseCode["No Parse Tag"] = 
"[noparse]\n\
[list]\n\
[*] List item!\n\
[/list]\n\
[b]BBCode![/b]\n\
[/noparse]";
    
    var testBbcode = function() {
        
        var myText = document.getElementById("inputCode").value,
            errMsgElm,
            removeExcessTags = document.getElementById("cbRmMisTags").checked,
            addInLineBreaks = document.getElementById("cbAddLb").checked;
        
        var result = XBBCODE.process({
            text: myText,
            removeMisalignedTags: removeExcessTags,
            addInLineBreaks: addInLineBreaks
        });
        
        errMsgElm = document.getElementById("errMsg");
        if ( result.error ) {
            errMsgElm.className = "errMsg-error";
            errMsgElm.innerHTML = "Errors: True";
            errMsgs.innerHTML = result.errorQueue.join("<br/>");
            errMsgs.style.display = "block";
        } else {
            errMsgElm.className = "errMsg-fine";
            errMsgElm.innerHTML = "Errors: False";
            errMsgs.style.display = "none";
        }

        document.getElementById("output").innerHTML = result.html;
    };
    
    var tcListChange = function() {
        if (tcList.selectedIndex === -1) {return;}
        
        var index = tcList.selectedIndex,
            optionValue = tcList.options[index].value;
        
        inputTextArea.value = testCaseCode[ optionValue ];
        testBbcode();
    };
    tcList.addEventListener("change", tcListChange, false);
    tcList.addEventListener("keyup", tcListChange, false);
    
    cbRmMisTags.addEventListener("click", testBbcode, false);
    cbAddLb.addEventListener("click", testBbcode, false);
    
    /*
        What happens when the "Test" button gets pressed
    */
    btn.addEventListener("click", testBbcode, false);

})();