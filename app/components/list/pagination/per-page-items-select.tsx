import { Form, useSearchParams, useSubmit } from "@remix-run/react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "~/components/forms";
import { getParamsValues } from "~/utils/list";

export default function PerPageItemsSelect() {
  const perPageValues = [20, 50, 100];
  const submit = useSubmit();
  const [searchParams] = useSearchParams();
  const { perPage } = getParamsValues(searchParams);
  return (
    <div className="relative">
      <Form
        onChange={(e) => {
          submit(e.currentTarget);
        }}
      >
        <Select
          name="per_page"
          defaultValue={
            perPageValues.includes(perPage) ? perPage.toString() : "20"
          }
        >
          <SelectTrigger className="px-3.5 py-3">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="w-[250px]" position="popper" align="start">
            <div className=" max-h-[320px] overflow-auto">
              {perPageValues.map((value) => (
                <SelectItem value={value.toString()} key={value}>
                  <span className="mr-4 text-[14px] font-semibold text-gray-700">
                    {value}
                  </span>
                </SelectItem>
              ))}
            </div>
          </SelectContent>
        </Select>
      </Form>
    </div>
  );
}
