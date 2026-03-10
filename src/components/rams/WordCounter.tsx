'use client';

interface WordCounterProps {
  text: string;
  maxWords: number;
}

export default function WordCounter({ text, maxWords }: WordCounterProps) {
  const wordCount = text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
  const isWarning = wordCount >= maxWords - 5;

  return (
    <div
      className={`questionnaire__word-count${
        isWarning ? ' questionnaire__word-count--warning' : ''
      }`}
    >
      {wordCount} / {maxWords} words
    </div>
  );
}
