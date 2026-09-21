"use client"

import * as React from "react";
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoices,
  QuestionnaireError,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSkip,
  QuestionnaireSubmit,
  QuestionnaireTitle,
} from "@/components/ui/questionnaire";

export default function TestForm() {
  const onSuccess = () => {
    console.log("it worked")
  }

  const items = [
    { name: "1" },
    // { name: "2" },
    // { name: "3" },
    // { name: "4" }
  ] as const;

  const handleSubmit = React.useCallback(
    async (ev) => {
      console.log(ev);

      console.log(Object.fromEntries(
        new FormData(ev.currentTarget)
      ))
      onSuccess();
    }, [onSuccess]);

  return (
    <>
      <h3>
        Test Form
      </h3>
      <Questionnaire items={items} onSubmit={handleSubmit}>

        <QuestionnaireItem name="1" required={false}>
          <QuestionnaireTitle>1</QuestionnaireTitle>
          <QuestionnaireInput type="number" name="1">
          </QuestionnaireInput>
          <QuestionnaireError />

        </QuestionnaireItem>

        <QuestionnaireActions className="w-full">
          <QuestionnairePrevious />
          <QuestionnaireSkip />
          <QuestionnaireNext />
          <QuestionnaireSubmit>
            Sumbit
          </QuestionnaireSubmit>
        </QuestionnaireActions>

      </Questionnaire >
    </>
  )

}
