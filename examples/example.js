var result = XBBCODE.process({
    text: "[b]bolded text[/b]",
    removeMisalignedTags: false,
    addInLineBreaks: false
});
console.log("Errors: " + result.error);
console.dir(result.errorQueue);
console.log(result.html);// the HTML form of your BBCode