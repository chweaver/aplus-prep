export type MultipleChoiceAnswer = {
  type: 'multiple-choice';
  choiceId: string;
};

export type MultiSelectAnswer = {
  type: 'multi-select';
  choiceIds: string[];
};

export type OrderingAnswer = {
  type: 'ordering';
  itemIds: string[];
};

// Maps leftId → rightId
export type MatchingAnswer = {
  type: 'matching';
  pairs: Record<string, string>;
};

// Maps itemId → bucketId
export type SortingAnswer = {
  type: 'sorting';
  assignments: Record<string, string>;
};

export type Answer =
  | MultipleChoiceAnswer
  | MultiSelectAnswer
  | OrderingAnswer
  | MatchingAnswer
  | SortingAnswer;
