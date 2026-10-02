export function printReport(title, printClass) {
  const previousTitle = document.title;
  const previousPrintClass = document.body.className;
  document.title = title;
  document.body.classList.add(printClass);
  window.print();
  window.setTimeout(() => {
    document.title = previousTitle;
    document.body.className = previousPrintClass;
  }, 1000);
}
