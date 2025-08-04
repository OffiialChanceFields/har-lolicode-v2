// Fix: Completed the JSX structure by closing the div and adding a list to display issues.
export const CodeOutput = ({ analysisResult }) => {
  if (!analysisResult) {
    return (
      <div className="output-placeholder">
        <p>Your analysis results will appear here.</p>
      </div>
    );
  }

  return (
    <div className="code-output-container">
      <h2>Analysis Score: {analysisResult.score}</h2>
      <ul>
        {analysisResult.issues.map((issue, index) => (
          <li key={index}>
            Line {issue.line}: {issue.message}
          </li>
        ))}
      </ul>
    </div>
  );
};
